// ---------------------------------------------------------------------------
// Metrica de Kerr-Newman y flujo hamiltoniano de geodesicas nulas.
//
// Replica exactamente `src/physics/kerrNewman.ts` y `src/physics/geodesic.ts`.
// Cualquier cambio aqui debe reflejarse alli: son las dos implementaciones que
// compara el test de paridad, y la de CPU es la que esta validada contra
// resultados analiticos.
//
// Formulacion (ver geodesic.ts para la derivacion completa):
//   2 Sigma H = Delta p_r^2 + p_theta^2 + F
//   F = -U^2/Delta + w^2,   U = (r^2+a^2)E - aL,   w = aE sin(th) - L/sin(th)
// El estado integrado es (r, theta, phi, p_r, p_theta); E y L son constantes.
// ---------------------------------------------------------------------------

uniform float u_a; // a = J/M^2
uniform float u_q; // q = Q/M

const float SIN_EPS = 1e-6;

/** Estado de un rayo: x = (r, theta, phi), p = (p_r, p_theta). */
struct State {
  vec3 x;
  vec2 p;
};

float knDelta(float r) {
  return r * r - 2.0 * r + u_a * u_a + u_q * u_q;
}

float knSigma(float r, float cosT) {
  return r * r + u_a * u_a * cosT * cosT;
}

float knBigA(float r, float sinT) {
  float r2a2 = r * r + u_a * u_a;
  return r2a2 * r2a2 - u_a * u_a * knDelta(r) * sinT * sinT;
}

/** Radio del horizonte exterior; devuelve -1 si es singularidad desnuda. */
float knHorizonOuter() {
  float disc = 1.0 - u_a * u_a - u_q * u_q;
  return disc < 0.0 ? -1.0 : 1.0 + sqrt(disc);
}

/** Ergosuperficie exterior r_E(theta) = 1 + sqrt(1 - q^2 - a^2 cos^2 theta). */
float knErgosphere(float cosT) {
  float disc = 1.0 - u_q * u_q - u_a * u_a * cosT * cosT;
  return disc < 0.0 ? -1.0 : 1.0 + sqrt(disc);
}

/** Arrastre de marcos omega = a (r^2 + a^2 - Delta) / A. */
float knFrameDragging(float r, float sinT) {
  return (u_a * (r * r + u_a * u_a - knDelta(r))) / knBigA(r, sinT);
}

/** Lapso del ZAMO alpha = sqrt(Delta Sigma / A) = dtau/dt. */
float knLapse(float r, float sinT, float cosT) {
  float v = knDelta(r) * knSigma(r, cosT) / knBigA(r, sinT);
  return v <= 0.0 ? 0.0 : sqrt(v);
}

/** Evita el cero de sin(theta) sin cambiar el signo. */
float safeSin(float sinT) {
  return abs(sinT) < SIN_EPS ? (sinT < 0.0 ? -SIN_EPS : SIN_EPS) : sinT;
}

/**
 * Lado derecho del sistema hamiltoniano reducido.
 * Se conserva el termino H * d_mu(Sigma) / Sigma en lugar de descartarlo por
 * H = 0, para que el flujo integrado sea el flujo hamiltoniano exacto.
 */
State geodesicRHS(State s, float E, float L) {
  float r = s.x.x;
  float th = s.x.y;
  float p_r = s.p.x;
  float p_th = s.p.y;

  float sinT = sin(th);
  float cosT = cos(th);
  float sf = safeSin(sinT);
  float s2 = sf * sf;

  float a = u_a;
  float a2 = a * a;
  float Del = knDelta(r);
  float dDel = 2.0 * (r - 1.0);
  float Sig = r * r + a2 * cosT * cosT;
  float Sig_r = 2.0 * r;
  float Sig_th = -2.0 * a2 * cosT * sinT;

  float U = (r * r + a2) * E - a * L;
  float w = a * E * sf - L / sf;

  float F = -U * U / Del + w * w;
  float dF_dr = -4.0 * r * E * U / Del + U * U * dDel / (Del * Del);
  float w_th = cosT * (a * E + L / s2);
  float dF_dth = 2.0 * w * w_th;
  float dF_dL = 2.0 * a * U / Del - 2.0 * w / sf;

  float N = Del * p_r * p_r + p_th * p_th + F;
  float H = N / (2.0 * Sig);
  float N_r = dDel * p_r * p_r + dF_dr;

  State d;
  d.x = vec3(Del * p_r / Sig, p_th / Sig, dF_dL / (2.0 * Sig));
  d.p = vec2(
    -N_r / (2.0 * Sig) + H * Sig_r / Sig,
    -dF_dth / (2.0 * Sig) + H * Sig_th / Sig
  );
  return d;
}

// ---------------------------------------------------------------------------
// Paso Runge-Kutta-Fehlberg 4(5) con coeficientes de Cash-Karp
// ---------------------------------------------------------------------------

/**
 * Un paso. Devuelve el estado de 5o orden y el error relativo estimado en
 * `errOut`, que es la diferencia entre las soluciones de 4o y 5o orden.
 */
State cashKarpStep(State s, float h, float E, float L, out float errOut) {
  State k1 = geodesicRHS(s, E, L);

  State y2;
  y2.x = s.x + h * (0.2 * k1.x);
  y2.p = s.p + h * (0.2 * k1.p);
  State k2 = geodesicRHS(y2, E, L);

  State y3;
  y3.x = s.x + h * (0.075 * k1.x + 0.225 * k2.x);
  y3.p = s.p + h * (0.075 * k1.p + 0.225 * k2.p);
  State k3 = geodesicRHS(y3, E, L);

  State y4;
  y4.x = s.x + h * (0.3 * k1.x - 0.9 * k2.x + 1.2 * k3.x);
  y4.p = s.p + h * (0.3 * k1.p - 0.9 * k2.p + 1.2 * k3.p);
  State k4 = geodesicRHS(y4, E, L);

  const float B51 = -11.0 / 54.0, B52 = 2.5, B53 = -70.0 / 27.0, B54 = 35.0 / 27.0;
  State y5;
  y5.x = s.x + h * (B51 * k1.x + B52 * k2.x + B53 * k3.x + B54 * k4.x);
  y5.p = s.p + h * (B51 * k1.p + B52 * k2.p + B53 * k3.p + B54 * k4.p);
  State k5 = geodesicRHS(y5, E, L);

  const float B61 = 1631.0 / 55296.0, B62 = 175.0 / 512.0, B63 = 575.0 / 13824.0;
  const float B64 = 44275.0 / 110592.0, B65 = 253.0 / 4096.0;
  State y6;
  y6.x = s.x + h * (B61 * k1.x + B62 * k2.x + B63 * k3.x + B64 * k4.x + B65 * k5.x);
  y6.p = s.p + h * (B61 * k1.p + B62 * k2.p + B63 * k3.p + B64 * k4.p + B65 * k5.p);
  State k6 = geodesicRHS(y6, E, L);

  const float C1 = 37.0 / 378.0, C3 = 250.0 / 621.0, C4 = 125.0 / 594.0, C6 = 512.0 / 1771.0;
  const float D1 = 2825.0 / 27648.0, D3 = 18575.0 / 48384.0, D4 = 13525.0 / 55296.0;
  const float D5 = 277.0 / 14336.0, D6 = 0.25;

  State out5;
  out5.x = s.x + h * (C1 * k1.x + C3 * k3.x + C4 * k4.x + C6 * k6.x);
  out5.p = s.p + h * (C1 * k1.p + C3 * k3.p + C4 * k4.p + C6 * k6.p);

  vec3 x4 = s.x + h * (D1 * k1.x + D3 * k3.x + D4 * k4.x + D5 * k5.x + D6 * k6.x);
  vec2 p4 = s.p + h * (D1 * k1.p + D3 * k3.p + D4 * k4.p + D5 * k5.p + D6 * k6.p);

  vec3 sx = abs(s.x) + abs(out5.x) + 1e-6;
  vec2 sp = abs(s.p) + abs(out5.p) + 1e-6;
  vec3 ex = abs(out5.x - x4) / sx;
  vec2 ep = abs(out5.p - p4) / sp;
  errOut = max(max(max(ex.x, ex.y), ex.z), max(ep.x, ep.y));

  return out5;
}

/** Paso Runge-Kutta 4 clasico, usado solo para refinar cruces del plano. */
State rk4Step(State s, float h, float E, float L) {
  State k1 = geodesicRHS(s, E, L);
  State y2;
  y2.x = s.x + 0.5 * h * k1.x;
  y2.p = s.p + 0.5 * h * k1.p;
  State k2 = geodesicRHS(y2, E, L);
  State y3;
  y3.x = s.x + 0.5 * h * k2.x;
  y3.p = s.p + 0.5 * h * k2.p;
  State k3 = geodesicRHS(y3, E, L);
  State y4;
  y4.x = s.x + h * k3.x;
  y4.p = s.p + h * k3.p;
  State k4 = geodesicRHS(y4, E, L);

  State o;
  o.x = s.x + (h / 6.0) * (k1.x + 2.0 * k2.x + 2.0 * k3.x + k4.x);
  o.p = s.p + (h / 6.0) * (k1.p + 2.0 * k2.p + 2.0 * k3.p + k4.p);
  return o;
}

// ---------------------------------------------------------------------------
// Camara: direccion local -> momento covariante
// ---------------------------------------------------------------------------

/**
 * Convierte una direccion unitaria en el cielo local del ZAMO
 * dir = (d_r, d_theta, d_phi) al momento covariante de un foton de energia
 * local unidad. Devuelve (p_t, p_r, p_theta, p_phi).
 *
 * La aberracion relativista y el arrastre de marcos quedan incorporados por
 * construccion al usar la tetrada del ZAMO.
 */
vec4 photonMomentum(float r, float th, vec3 dir) {
  float sinT = sin(th);
  float cosT = cos(th);
  float sf = max(abs(sinT), 1e-7) * (sinT < 0.0 ? -1.0 : 1.0);

  float Sig = knSigma(r, cosT);
  float Del = knDelta(r);
  float A = knBigA(r, sinT);
  float omega = knFrameDragging(r, sinT);
  float N = sqrt(A / (Del * Sig)); // 1 / alpha

  // Componentes contravariantes p^mu en la base coordenada.
  float pt_up = N;
  float pr_up = dir.x * sqrt(Del / Sig);
  float pth_up = dir.y / sqrt(Sig);
  float pph_up = N * omega + dir.z * sqrt(Sig) / (sqrt(A) * sf);

  // Metrica covariante para bajar los indices.
  float s2 = sinT * sinT;
  float g_tt = -(Del - u_a * u_a * s2) / Sig;
  float g_tphi = -u_a * s2 * (r * r + u_a * u_a - Del) / Sig;
  float g_phiphi = A * s2 / Sig;

  return vec4(
    g_tt * pt_up + g_tphi * pph_up,
    (Sig / Del) * pr_up,
    Sig * pth_up,
    g_tphi * pt_up + g_phiphi * pph_up
  );
}

/**
 * Direccion de la velocidad del rayo en pseudo-cartesianas
 * (x, y, z) = (r sin th cos ph, r sin th sin ph, r cos th), con z el eje de espin.
 * Para un rayo que escapa es la posicion celeste de donde proviene la luz.
 */
vec3 velocityDirection(State s, float E, float L) {
  State d = geodesicRHS(s, E, L);
  float r = s.x.x;
  float st = sin(s.x.y);
  float ct = cos(s.x.y);
  float sp = sin(s.x.z);
  float cp = cos(s.x.z);
  float dr = d.x.x, dth = d.x.y, dph = d.x.z;

  return normalize(vec3(
    dr * st * cp + r * ct * cp * dth - r * st * sp * dph,
    dr * st * sp + r * ct * sp * dth + r * st * cp * dph,
    dr * ct - r * st * dth
  ));
}
