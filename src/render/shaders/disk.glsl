// ---------------------------------------------------------------------------
// Disco de acrecion delgado: perfil de Novikov-Thorne, cinematica kepleriana,
// corrimiento total (Doppler + gravitacional) y color de cuerpo negro.
//
// Requiere metric.glsl.
// ---------------------------------------------------------------------------

uniform sampler2D u_bbLUT;   // RGB = cromaticidad, A = log10(radiancia visible)
uniform float u_lutLogTMin;
uniform float u_lutLogTMax;

uniform float u_diskInner;   // r_in, normalmente el ISCO
uniform float u_diskOuter;   // r_out
uniform float u_diskTempMax; // T_max en kelvin
uniform float u_diskOpacity; // 0 = transparente, 1 = opticamente grueso
uniform float u_diskTime;    // fase de rotacion (en unidades de t geometrico)
uniform float u_diskTurbulence;
uniform float u_diskPrograde; // +1 corrotante, -1 contrarrotante

/**
 * Calibracion del brillo del disco.
 *
 * La radiancia que sale de la LUT esta en unidades relativas a un cuerpo negro
 * de referencia y abarca varias decadas segun la temperatura. Este factor la
 * lleva al rango que espera el tonemap, y se calcula en CPU (Renderer.ts):
 *  - exposicion automatica: normaliza por la radiancia a T_max, de modo que el
 *    disco queda bien expuesto a cualquier masa;
 *  - exposicion fisica: normaliza por una referencia FIJA, de modo que el brillo
 *    cambia de verdad con la masa via T ~ M^-1/4.
 *
 * Se aplica aqui y no en la exposicion global a proposito: si escalara la imagen
 * completa, las estrellas del fondo cambiarian de brillo al mover la masa del
 * agujero negro, que es fisicamente absurdo.
 */
uniform float u_diskBrightness;

const float LN10 = 2.302585092994046;

// ---------------------------------------------------------------------------
// Orbitas circulares ecuatoriales
// ---------------------------------------------------------------------------

/**
 * Velocidad angular Omega = dphi/dt de la orbita circular ecuatorial en r,
 * de la condicion geodesica d_r g_tt + 2 Omega d_r g_tphi + Omega^2 d_r g_phiphi = 0.
 * Para Kerr se reduce a Omega = 1/(r^{3/2} + a).
 */
float diskOmega(float r) {
  float a = u_a;
  float q2 = u_q * u_q;
  float r2 = r * r;
  float r3 = r2 * r;

  float dg_tt = -2.0 / r2 + 2.0 * q2 / r3;
  float dg_tphi = -a * dg_tt;
  float dg_phiphi = 2.0 * r - 2.0 * a * a / r2 + 2.0 * a * a * q2 / r3;

  float disc = dg_tphi * dg_tphi - dg_tt * dg_phiphi;
  disc = max(disc, 0.0);
  return (-dg_tphi + u_diskPrograde * sqrt(disc)) / dg_phiphi;
}

/** Componentes ecuatoriales de la metrica covariante (theta = pi/2). */
void diskMetricEq(float r, out float g_tt, out float g_tphi, out float g_phiphi) {
  float a2 = u_a * u_a;
  float r2 = r * r;
  float Del = knDelta(r);
  g_tt = -(Del - a2) / r2;
  g_tphi = -u_a * (r2 + a2 - Del) / r2;
  float A = (r2 + a2) * (r2 + a2) - a2 * Del;
  g_phiphi = A / r2;
}

/** u^t de la orbita circular; 0 si no existe orbita temporal en r. */
float diskUt(float r, float Om) {
  float g_tt, g_tphi, g_phiphi;
  diskMetricEq(r, g_tt, g_tphi, g_phiphi);
  float norm = g_tt + 2.0 * Om * g_tphi + Om * Om * g_phiphi;
  return norm >= 0.0 ? 0.0 : 1.0 / sqrt(-norm);
}

// ---------------------------------------------------------------------------
// Perfil de temperatura
// ---------------------------------------------------------------------------

/**
 * Forma radial de Novikov-Thorne / Shakura-Sunyaev:
 *   f(r) = r^{-3/4} [1 - sqrt(r_in/r)]^{1/4}
 * normalizada a 1 en su maximo, que esta en r = (49/36) r_in.
 */
float diskTempProfile(float r) {
  if (r <= u_diskInner) return 0.0;
  float rin = u_diskInner;
  float f = pow(r, -0.75) * pow(max(1.0 - sqrt(rin / r), 0.0), 0.25);
  float rPeak = (49.0 / 36.0) * rin;
  float fPeak = pow(rPeak, -0.75) * pow(1.0 - sqrt(rin / rPeak), 0.25);
  return fPeak > 0.0 ? f / fPeak : 0.0;
}

// ---------------------------------------------------------------------------
// Ruido para la estructura turbulenta
// ---------------------------------------------------------------------------

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

/**
 * Ruido de valor periodico en x con periodo `periodX` celdas.
 *
 * La periodicidad no es un lujo: la coordenada azimutal da la vuelta en phi = 2pi
 * y un ruido no periodico deja una costura recta y visible en el disco. Se logra
 * envolviendo el indice ENTERO de la rejilla con mod(), de modo que la celda
 * periodX coincide exactamente con la celda 0.
 */
float periodicValueNoise(vec2 p, float periodX) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, periodX);
  float x1 = mod(i.x + 1.0, periodX);
  float a = hash21(vec2(x0, i.y));
  float b = hash21(vec2(x1, i.y));
  float c = hash21(vec2(x0, i.y + 1.0));
  float d = hash21(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/**
 * FBM de 4 octavas periodica en el azimut.
 * `angle` es el azimut en el marco corrotante y `radial` la coordenada radial.
 * Cada octava dobla la frecuencia y tambien el periodo, que asi sigue siendo
 * un numero entero de celdas y mantiene la continuidad en la vuelta completa.
 */
float diskFbm(float angle, float radial) {
  const float BASE_PERIOD = 16.0;
  float v = 0.0;
  float amp = 0.5;
  float period = BASE_PERIOD;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    // angle/(2pi) * period recorre exactamente `period` celdas en una vuelta.
    vec2 p = vec2((angle / 6.283185307) * period, radial * freq);
    v += amp * periodicValueNoise(p, period);
    period *= 2.0;
    freq *= 2.03;
    amp *= 0.5;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Color de cuerpo negro desde la LUT
// ---------------------------------------------------------------------------

/**
 * Emision visible de un cuerpo negro a temperatura T (kelvin), en RGB lineal.
 * La LUT guarda la cromaticidad con luminancia unidad y, en el canal alfa, el
 * log10 de la radiancia visible relativa: en logaritmo la interpolacion lineal
 * de la textura es fiel a lo largo de las ~20 decadas que cubre el rango.
 */
vec3 blackbodyEmission(float T) {
  if (T <= 0.0) return vec3(0.0);
  float logT = log(T) / LN10;
  float idx = (logT - u_lutLogTMin) / (u_lutLogTMax - u_lutLogTMin);
  vec4 s = texture(u_bbLUT, vec2(clamp(idx, 0.001, 0.999), 0.5));
  return s.rgb * pow(10.0, s.a);
}

// ---------------------------------------------------------------------------
// Emision del disco en un cruce del plano ecuatorial
// ---------------------------------------------------------------------------

/**
 * Radiancia observada al cruzar el plano ecuatorial en radio r con azimut phi,
 * para un rayo de momento (E, L). Devuelve el color en `emission` y la opacidad
 * acumulada en `alpha`.
 *
 * El corrimiento total es un solo factor
 *   g = (p.u)_camara / (p.u)_disco = 1 / [u^t (E - Omega L)]
 * que engloba Doppler relativista y corrimiento gravitacional. La energia local
 * del foton en la camara es 1 por construccion de la tetrada, de ahi el
 * numerador unidad.
 *
 * No se aplica un g^4 sobre un color fijo: la radiacion observada de un cuerpo
 * negro a T con corrimiento g es exactamente un cuerpo negro a g*T, asi que se
 * consulta la LUT en g*T. Eso da brillo y color correctos a la vez, e incluye
 * que solo parte del flujo caiga en la banda visible (ver blackbody.ts).
 */
void diskSample(
  float r,
  float phi,
  float E,
  float L,
  out vec3 emission,
  out float alpha
) {
  emission = vec3(0.0);
  alpha = 0.0;
  if (r < u_diskInner || r > u_diskOuter) return;

  float Om = diskOmega(r);
  float ut = diskUt(r, Om);
  if (ut <= 0.0) return;

  // Factor de corrimiento total.
  float denom = ut * (E - Om * L);
  if (denom <= 1e-6) return;
  float g = 1.0 / denom;

  float Temit = u_diskTempMax * diskTempProfile(r);
  if (Temit <= 0.0) return;

  // Estructura turbulenta en el marco corrotante: la fase avanza con
  // Omega(r)*t, de modo que el cizallamiento por rotacion diferencial es el
  // que corresponde al perfil kepleriano.
  float shear = phi - Om * u_diskTime;
  float n = diskFbm(shear, log(r) * 6.0);
  float turb = mix(1.0, 0.35 + 1.3 * n, clamp(u_diskTurbulence, 0.0, 1.0));

  float Tobs = g * Temit;
  emission = blackbodyEmission(Tobs) * turb * u_diskBrightness;

  // Bordes suaves para no aliasear el corte radial.
  float edge = smoothstep(0.0, 0.06, (r - u_diskInner) / max(u_diskInner, 1.0)) *
               (1.0 - smoothstep(0.85, 1.0, r / u_diskOuter));
  emission *= edge;
  alpha = clamp(u_diskOpacity * edge, 0.0, 1.0);
}
