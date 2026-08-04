#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

// ---------------------------------------------------------------------------
// Trazador de dos agujeros negros sobre datos iniciales de Brill-Lindquist.
//
// No hay disco de acrecion en este modo: lo interesante aqui es el lente DOBLE
// sobre el fondo estelar, con sus dos sombras, sus imagenes multiples y los
// anillos de Einstein cruzados. Meter un disco taparia justo eso.
//
// Limite declarado, tambien en la interfaz: la metrica es solucion exacta de las
// LIGADURAS de Einstein en cada instante, pero no de las ecuaciones de evolucion.
// Las posiciones de los dos agujeros las da la dinamica post-newtoniana, no
// Einstein: una secuencia de instantaneas no es una fusion simulada.
// ---------------------------------------------------------------------------

#include "binaryMetric.glsl"
#include "blackbody.glsl"
#include "starfield.glsl"

uniform vec3 u_camPos;   // posicion de la camara, cartesianas isotropas
uniform vec3 u_camRight;
uniform vec3 u_camUp;
uniform vec3 u_camFwd;
uniform float u_tanHalfFov;
uniform float u_aspect;
uniform vec2 u_resolution;
uniform vec2 u_jitter;

uniform int u_maxIter;
uniform float u_tol;
uniform float u_rEscape;
uniform float u_alphaCapture;
uniform float u_hInit;
uniform bool u_markNonConverged;

/** Rejilla sobre el horizonte de cada agujero, para distinguirlos. */
uniform bool u_showHorizonGrid;
uniform float u_layerOpacity;

uniform sampler2D u_prevAccum;
uniform float u_sampleIndex;

out vec4 fragColor;

const int HARD_ITER_CAP = 4096;
const float PI_B = 3.14159265358979;

/** Rejilla de meridianos y paralelos alrededor de una puntura. */
vec3 punctureGrid(vec3 x, vec3 center, vec3 tint) {
  vec3 d = x - center;
  float r = max(length(d), 1e-6);
  float theta = acos(clamp(d.z / r, -1.0, 1.0));
  float phi = atan(d.y, d.x);

  float latSpacing = PI_B / 8.0;
  float lonSpacing = (2.0 * PI_B) / 16.0;
  float kLat = theta / latSpacing;
  float kLon = phi / lonSpacing;
  float dLat = abs(kLat - round(kLat)) * latSpacing;
  float dLon = abs(kLon - round(kLon)) * lonSpacing * max(sin(theta), 0.15);
  float w = 0.05;
  float m = max(
    1.0 - smoothstep(w * 0.4, w, dLat),
    1.0 - smoothstep(w * 0.4, w, dLon)
  );
  return tint * m * u_layerOpacity;
}

void main() {
  vec2 px = gl_FragCoord.xy + u_jitter;
  vec2 ndc = (px / u_resolution) * 2.0 - 1.0;

  // Camara 3D general: sin simetria axial no hay una base privilegiada.
  vec3 dir = normalize(
    u_camFwd +
    u_camRight * (ndc.x * u_tanHalfFov * u_aspect) +
    u_camUp * (ndc.y * u_tanHalfFov)
  );

  float E;
  BinState s = blPhoton(u_camPos, dir, E);

  vec3 radiance = vec3(0.0);
  float h = u_hInit;
  bool resolved = false;

  for (int i = 0; i < HARD_ITER_CAP; i++) {
    if (i >= u_maxIter) break;

    // El paso se limita por la distancia a la puntura mas cercana: es donde la
    // curvatura crece sin cota.
    float hCap = max(1e-5, 0.2 * blNearest(s.x));
    h = min(h, hCap);

    float err;
    BinState next = blStep(s, h, E, err);

    if (err > u_tol && h > 1e-6) {
      h *= max(0.2, 0.9 * pow(u_tol / err, 0.2));
      continue;
    }

    s = next;

    // Captura. Se corta en alpha = u_alphaCapture y no en alpha = 0 porque el
    // termino E^2 d(alpha)/alpha^3 diverge en el horizonte y estancaria el paso
    // adaptativo. Ver ALPHA_CAPTURE en binary.ts.
    float psi = blPsi(s.x);
    if (blLapse(psi) <= u_alphaCapture) {
      if (u_showHorizonGrid) {
        // Se colorea segun cual de los dos capturo el rayo, para que las dos
        // sombras se distingan.
        float d1 = length(s.x - u_bh1Pos);
        float d2 = length(s.x - u_bh2Pos);
        radiance += d1 < d2
          ? punctureGrid(s.x, u_bh1Pos, vec3(0.95, 0.35, 0.30))
          : punctureGrid(s.x, u_bh2Pos, vec3(0.35, 0.60, 1.00));
      }
      resolved = true;
      break;
    }

    // Escape.
    if (length(s.x) >= u_rEscape) {
      BinState d = blRHS(s, E);
      if (dot(s.x, d.x) > 0.0) {
        // A gran distancia psi -> 1, asi que la direccion de la velocidad es la
        // del momento.
        radiance += background(normalize(s.p));
        resolved = true;
        break;
      }
    }

    h *= min(5.0, 0.9 * pow(u_tol / max(err, 1e-12), 0.2));
  }

  if (!resolved) {
    if (u_markNonConverged) {
      radiance += vec3(1.0, 0.0, 0.8);
    } else {
      radiance += background(normalize(s.p)) * 0.5;
    }
  }

  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 prev = texture(u_prevAccum, uv).rgb;
  float n = u_sampleIndex;
  fragColor = vec4(n < 0.5 ? radiance : mix(prev, radiance, 1.0 / (n + 1.0)), 1.0);
}
