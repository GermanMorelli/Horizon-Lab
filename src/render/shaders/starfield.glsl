// ---------------------------------------------------------------------------
// Fondo estelar procedural.
//
// No usa ningun asset: las estrellas se generan por hash sobre la direccion, y
// su color sale de la misma LUT de cuerpo negro que el disco (las estrellas son
// cuerpos negros a 2500-30000 K). Se anade una banda galactica difusa que sirve
// de referencia visual para leer la distorsion del lente.
//
// Requiere disk.glsl (para blackbodyEmission).
// ---------------------------------------------------------------------------

uniform float u_starIntensity;
uniform float u_starDensity;
uniform float u_milkyWayIntensity;
uniform samplerCube u_starCube;
uniform bool u_useStarCube;

/**
 * Calibracion absoluta del fondo.
 *
 * El fondo y el disco alimentan el mismo tonemap, asi que sus escalas tienen que
 * ser coherentes: con el pico del disco normalizado a ~1, una estrella brillante
 * debe rondar 0.05 y la banda galactica 0.02. Estas constantes son fijas y NO
 * dependen de los parametros del agujero negro, para que las estrellas no
 * cambien de brillo al mover la masa.
 */
const float STAR_CALIBRATION = 0.09;
const float MW_CALIBRATION = 0.03;
const float GALAXY_CALIBRATION = 0.5;

// ---------------------------------------------------------------------------
// Galaxias de fondo
//
// Una galaxia NO orbita un agujero negro: tiene ~10^11 masas solares y ~30 kpc de
// diametro, asi que es el objeto grande y el agujero el pequeno. Lo que si es real,
// y es lo que se hace aqui, es el LENTE GRAVITACIONAL de galaxias de fondo: sus
// arcos, sus anillos de Einstein y sus imagenes multiples son astronomia
// observacional corriente (Hubble, JWST).
//
// Aqui no se dibuja ningun arco: se define el perfil de brillo de la galaxia en el
// cielo asintotico, y la deformacion la produce el propio trazado de geodesicas al
// muestrear ese perfil con la direccion de escape del rayo.
// ---------------------------------------------------------------------------

#define MAX_GALAXIES 4

uniform int u_galaxyCount;
/** Direccion unitaria de cada galaxia en el cielo asintotico. */
uniform vec3 u_galaxyDir[MAX_GALAXIES];
/** (radio angular, razon de ejes, angulo de posicion, brillo). */
uniform vec4 u_galaxyShape[MAX_GALAXIES];
/** Color en RGB lineal. */
uniform vec3 u_galaxyColor[MAX_GALAXIES];
/** Intensidad de los brazos espirales, 0 = eliptica lisa. */
uniform float u_galaxySpiral;

/**
 * Brillo superficial de las galaxias de fondo en la direccion `dir`.
 *
 * Perfil: disco exponencial (Sersic n = 1) mas una componente central mas
 * concentrada, con una modulacion espiral logaritmica opcional. La proyeccion al
 * plano tangente es gnomonica, valida mientras la galaxia sea pequena en el cielo,
 * que es siempre el caso.
 */
vec3 galaxyLight(vec3 dir) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < MAX_GALAXIES; i++) {
    if (i >= u_galaxyCount) break;

    vec3 g = u_galaxyDir[i];
    float cosA = dot(dir, g);
    // Detras del observador o a mas de 90 grados: no contribuye.
    if (cosA <= 0.05) continue;

    // Base ortonormal en el plano tangente a la esfera celeste en g.
    vec3 helper = abs(g.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(helper, g));
    vec3 t2 = cross(g, t1);

    // Proyeccion gnomonica del desplazamiento angular.
    vec3 off = dir / cosA - g;
    float u = dot(off, t1);
    float v = dot(off, t2);

    // Rotacion por el angulo de posicion y achatamiento por la razon de ejes:
    // asi la galaxia se ve inclinada, no siempre de frente.
    float pa = u_galaxyShape[i].z;
    float cu = cos(pa) * u + sin(pa) * v;
    float cv = (-sin(pa) * u + cos(pa) * v) / max(u_galaxyShape[i].y, 0.05);

    float scale = max(u_galaxyShape[i].x, 1e-5);
    float rad = length(vec2(cu, cv)) / scale;
    if (rad > 6.0) continue;

    // Disco exponencial + componente central.
    float disc = exp(-1.68 * rad);
    float core = 0.45 * exp(-3.5 * sqrt(rad));

    // Brazos espirales logaritmicos: dos brazos, con la fase creciendo como log(r).
    float ang = atan(cv, cu);
    float arms = 1.0 + u_galaxySpiral * 0.5 * sin(2.0 * ang + 5.0 * log(max(rad, 0.06)));

    sum += u_galaxyColor[i] * u_galaxyShape[i].w * (disc * arms + core);
  }
  return sum * GALAXY_CALIBRATION;
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1, 0, 0));
  float n010 = hash13(i + vec3(0, 1, 0));
  float n110 = hash13(i + vec3(1, 1, 0));
  float n001 = hash13(i + vec3(0, 0, 1));
  float n101 = hash13(i + vec3(1, 0, 1));
  float n011 = hash13(i + vec3(0, 1, 1));
  float n111 = hash13(i + vec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

float fbm3(vec3 p, int octaves) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    v += amp * valueNoise3(p);
    p *= 2.07;
    amp *= 0.5;
  }
  return v;
}

/**
 * Una capa de estrellas puntuales. Se hashea la celda de una rejilla cubica
 * sobre la esfera de direcciones; cada celda contiene una estrella en posicion
 * aleatoria, con magnitud y temperatura aleatorias.
 *
 * El perfil es una gaussiana estrecha en la distancia angular, lo que hace que
 * las estrellas se estiren correctamente en arcos cuando el lente las deforma:
 * la deformacion la produce el trazado, no un truco de dibujado.
 */
vec3 starLayer(vec3 dir, float scale, float density, float sizeScale) {
  vec3 p = dir * scale;
  vec3 cell = floor(p);
  vec3 rnd = hash33(cell);

  // Solo una fraccion de las celdas contiene estrella.
  if (rnd.x > density) return vec3(0.0);

  // Posicion de la estrella dentro de la celda, proyectada a la esfera.
  // Se confina al 50% central: como solo se consulta la celda que contiene el
  // pixel, una estrella pegada al borde veria su perfil gaussiano cortado en
  // seco y se dibujaria como un bloque en vez de un punto.
  vec3 starPos = cell + 0.25 + 0.5 * vec3(rnd.y, rnd.z, fract(rnd.x * 71.13));
  vec3 starDir = normalize(starPos);

  float cosAng = dot(dir, starDir);
  float ang = acos(clamp(cosAng, -1.0, 1.0));

  // Magnitud: distribucion sesgada a muchas estrellas debiles y pocas brillantes.
  float mag = pow(fract(rnd.y * 313.7 + rnd.z * 71.3), 3.0);
  // El radio se mantiene bien por debajo del cuarto de celda disponible, de modo
  // que la gaussiana cae a cero antes de llegar al borde y no se recorta.
  float radius = sizeScale * (0.35 + 0.65 * mag) / scale;
  float falloff = exp(-(ang * ang) / (radius * radius));
  if (falloff < 1e-4) return vec3(0.0);

  // Temperatura estelar 2500-30000 K, con su color fisico desde la LUT.
  float T = mix(2500.0, 30000.0, pow(fract(rnd.z * 157.31), 1.6));
  vec3 color = blackbodyEmission(T);
  // Normalizar para que la LUT no imponga el brillo: aqui manda `mag`.
  color /= max(max(color.r, color.g), max(color.b, 1e-6));

  return color * falloff * (0.05 + 3.0 * mag);
}

/**
 * Banda galactica difusa. Es un realce a lo largo del plano z = 0 en
 * pseudo-cartesianas modulado por ruido, con nubes oscuras de polvo.
 * Da una referencia extensa que hace legibles los anillos de Einstein.
 */
vec3 milkyWay(vec3 dir) {
  // La banda se inclina respecto al eje de espin para que no coincida con el
  // plano del disco y las dos estructuras se distingan.
  vec3 d = normalize(vec3(dir.x, dir.y * 0.94 + dir.z * 0.34, -dir.y * 0.34 + dir.z * 0.94));

  float band = exp(-(d.z * d.z) / 0.045);
  float clouds = fbm3(d * 6.0, 5);
  float dust = smoothstep(0.35, 0.75, fbm3(d * 11.0 + 17.0, 4));

  float bright = band * (0.35 + 0.9 * clouds) * (1.0 - 0.75 * dust);
  vec3 tint = mix(vec3(0.55, 0.62, 0.95), vec3(1.0, 0.92, 0.78), clouds);
  return tint * bright;
}

/** Radiancia del fondo en la direccion asintotica `dir`. */
vec3 background(vec3 dir) {
  if (u_useStarCube) {
    return texture(u_starCube, dir).rgb * u_starIntensity;
  }

  vec3 c = vec3(0.0);
  c += starLayer(dir, 140.0, u_starDensity * 0.55, 0.13);
  c += starLayer(dir, 320.0, u_starDensity * 0.45, 0.11);
  c += starLayer(dir, 760.0, u_starDensity * 0.35, 0.10);
  c *= u_starIntensity * STAR_CALIBRATION;
  c += milkyWay(dir) * u_milkyWayIntensity * MW_CALIBRATION;
  c += galaxyLight(dir);
  return c;
}
