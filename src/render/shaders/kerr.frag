#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

// ---------------------------------------------------------------------------
// Trazador de geodesicas nulas de Kerr-Newman.
//
// Un rayo por pixel, integrado hacia atras desde la camara con Cash-Karp 4(5)
// adaptativo. La sombra, el anillo de fotones, los anillos de Einstein, el
// beaming Doppler y el corrimiento gravitacional no se dibujan: salen de la
// integracion. Ver README para las relaciones que valida la suite de tests.
// ---------------------------------------------------------------------------

#include "metric.glsl"
#include "blackbody.glsl"
#include "disk.glsl"
#include "starfield.glsl"
#include "layers.glsl"

uniform vec3 u_camPos; // (r, theta, phi) en Boyer-Lindquist
uniform float u_tanHalfFov;
uniform float u_aspect;
uniform vec2 u_resolution;
uniform vec2 u_jitter; // desplazamiento subpixel, en pixeles

uniform int u_maxIter;
uniform float u_tol;
uniform float u_rEscape;
uniform float u_rCapture;
uniform float u_hInit;

uniform bool u_diskEnabled;
uniform bool u_starsEnabled;
uniform bool u_markNonConverged;

uniform sampler2D u_prevAccum;
uniform float u_sampleIndex; // 0 en la primera muestra del lote

out vec4 fragColor;

/** Tope absoluto de iteraciones; u_maxIter recorta por debajo en tiempo real. */
const int HARD_ITER_CAP = 4096;

void main() {
  // --- Direccion del pixel en el cielo local del ZAMO ----------------------
  vec2 px = gl_FragCoord.xy + u_jitter;
  vec2 ndc = (px / u_resolution) * 2.0 - 1.0;

  // La camara mira siempre al centro: adelante = -e_r, arriba = -e_theta
  // (theta crece hacia el sur), derecha = +e_phi.
  vec3 dLocal = normalize(vec3(
    -1.0,
    -ndc.y * u_tanHalfFov,
    ndc.x * u_tanHalfFov * u_aspect
  ));

  vec4 pmu = photonMomentum(u_camPos.x, u_camPos.y, dLocal);
  float E = -pmu.x; // constante de movimiento
  float L = pmu.w;  // constante de movimiento

  State s;
  s.x = u_camPos;
  s.p = vec2(pmu.y, pmu.z);

  vec3 radiance = vec3(0.0);
  float transmittance = 1.0;
  float h = u_hInit;
  bool resolved = false;

  // --- Integracion ---------------------------------------------------------
  for (int i = 0; i < HARD_ITER_CAP; i++) {
    if (i >= u_maxIter) break;

    // Limitador de paso: nunca saltar dentro del horizonte.
    float hCap = max(1e-6, 0.25 * (s.x.x - u_rCapture));

    // Cerca del plano del disco se acota dtheta por paso para que el cruce se
    // localice con precision (de ahi sale la nitidez del anillo de fotones).
    if (u_diskEnabled && s.x.x > u_diskInner - 1.0 && s.x.x < u_diskOuter + 2.0) {
      float Sig = knSigma(s.x.x, cos(s.x.y));
      float dthAbs = abs(s.p.y) / Sig;
      hCap = min(hCap, 0.02 / max(dthAbs, 1e-4));
    }
    h = min(h, hCap);

    float err;
    State next = cashKarpStep(s, h, E, L, err);

    if (err > u_tol && h > 1e-7) {
      // Paso rechazado: reducir y reintentar (consume iteracion, no avanza).
      h *= max(0.2, 0.9 * pow(u_tol / err, 0.2));
      continue;
    }

    // --- Cruce del plano ecuatorial: emision del disco ---------------------
    float cPrev = cos(s.x.y);
    float cNext = cos(next.x.y);
    if (cPrev * cNext < 0.0) {
      // Interpolacion lineal en cos(theta) y un refinamiento de Newton, ambos
      // evaluados con subpasos RK4 exactos desde el estado anterior.
      float f = cPrev / (cPrev - cNext);
      State hit = rk4Step(s, h * f, E, L);

      State dh = geodesicRHS(hit, E, L);
      float dCos = -sin(hit.x.y) * dh.x.y;
      if (abs(dCos) > 1e-9) {
        float dLambda = -cos(hit.x.y) / dCos;
        hit = rk4Step(s, h * f + dLambda, E, L);
      }

      if (u_diskEnabled) {
        vec3 emis;
        float alpha;
        diskSample(hit.x.x, hit.x.z, E, L, emis, alpha);
        radiance += transmittance * emis;
        transmittance *= (1.0 - alpha);
      }
      radiance += transmittance * iscoRing(hit.x.x);

      if (transmittance < 0.003) {
        resolved = true;
        break;
      }
    }

    // --- Capas geometricas (lente correcto: son cruces reales del rayo) ----
    radiance += transmittance * layerContribution(s.x, next.x);

    s = next;

    // --- Captura ----------------------------------------------------------
    if (s.x.x <= u_rCapture) {
      radiance += transmittance * horizonGrid(s.x);
      resolved = true;
      break;
    }

    // --- Escape -----------------------------------------------------------
    if (s.x.x >= u_rEscape) {
      State d = geodesicRHS(s, E, L);
      if (d.x.x > 0.0) {
        if (u_starsEnabled) {
          float r = s.x.x;
          float st = sin(s.x.y), ct = cos(s.x.y);
          float sp = sin(s.x.z), cp = cos(s.x.z);
          vec3 dir = normalize(vec3(
            d.x.x * st * cp + r * ct * cp * d.x.y - r * st * sp * d.x.z,
            d.x.x * st * sp + r * ct * sp * d.x.y + r * st * cp * d.x.z,
            d.x.x * ct - r * st * d.x.y
          ));
          radiance += transmittance * background(dir);
        }
        resolved = true;
        break;
      }
    }

    // Crecer el paso si el error lo permite.
    h *= min(5.0, 0.9 * pow(u_tol / max(err, 1e-12), 0.2));
  }

  // --- Rayos que agotaron las iteraciones ---------------------------------
  if (!resolved) {
    if (u_markNonConverged) {
      // Modo diagnostico: hace visible donde falta presupuesto de pasos.
      radiance += vec3(1.0, 0.0, 0.8) * transmittance;
    } else if (u_starsEnabled) {
      // Mejor estimacion disponible en vez de un pixel negro.
      radiance += transmittance * background(velocityDirection(s, E, L)) * 0.5;
    }
  }

  // --- Acumulacion progresiva (media corrida) -----------------------------
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 prev = texture(u_prevAccum, uv).rgb;
  float n = u_sampleIndex;
  vec3 outColor = n < 0.5 ? radiance : mix(prev, radiance, 1.0 / (n + 1.0));

  fragColor = vec4(outColor, 1.0);
}
