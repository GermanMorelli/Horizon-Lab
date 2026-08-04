// ---------------------------------------------------------------------------
// Capas geometricas conmutables: horizonte, ergosfera, esfera de fotones, ISCO
// y malla de coordenadas.
//
// Se dibujan DENTRO del trazador, detectando cuando el rayo cruza cada
// superficie. Eso significa que aparecen con su lente gravitacional correcto:
// no son un overlay pintado sobre la imagen, sino la imagen real de esas
// superficies. Es la diferencia entre un diagrama y una observacion.
//
// (El horizonte interior de Cauchy no se puede mostrar asi: esta dentro de r_+ y
// ningun rayo lo alcanza. Es causalmente inaccesible por construccion, y el HUD
// lo reporta como numero en vez de dibujarlo.)
//
// Requiere metric.glsl.
// ---------------------------------------------------------------------------

uniform bool u_showHorizon;
uniform bool u_showErgosphere;
uniform bool u_showPhotonSphere;
uniform bool u_showIsco;
uniform bool u_showDragGrid;

uniform float u_iscoRadius;
uniform float u_photonRadius;
uniform float u_dragGridRadius;
uniform float u_layerOpacity;

const float PI_L = 3.14159265358979;

/** Mascara de linea: 1 en los multiplos de `spacing`, 0 fuera. */
float lineMask(float v, float spacing, float halfWidth) {
  float k = v / spacing;
  float d = abs(k - round(k)) * spacing;
  return 1.0 - smoothstep(halfWidth * 0.4, halfWidth, d);
}

/**
 * Rejilla de meridianos y paralelos sobre una superficie de revolucion.
 * `arc` escala el ancho de linea con el radio para que se vea uniforme.
 */
float sphereGrid(float theta, float phi, float arc, float nLat, float nLon) {
  float lat = lineMask(theta, PI_L / nLat, arc);
  // Los meridianos se estrechan hacia los polos: se compensa con sin(theta).
  float lon = lineMask(phi, (2.0 * PI_L) / nLon, arc / max(sin(theta), 0.15));
  return clamp(max(lat, lon), 0.0, 1.0);
}

/** Interpola linealmente el estado entre dos pasos en la fraccion f. */
vec3 lerpX(vec3 a, vec3 b, float f) {
  return a + (b - a) * f;
}

/**
 * Contribucion de las capas al cruzar de `prev` a `cur`.
 * Devuelve color premultiplicado (se suma con la transmitancia acumulada).
 */
vec3 layerContribution(vec3 prev, vec3 cur) {
  vec3 col = vec3(0.0);
  if (u_layerOpacity <= 0.0) return col;

  // --- Ergosfera: superficie r = r_E(theta), se achata con el espin ---------
  if (u_showErgosphere) {
    float fPrev = prev.x - knErgosphere(cos(prev.y));
    float fCur = cur.x - knErgosphere(cos(cur.y));
    if (fPrev * fCur < 0.0) {
      float f = fPrev / (fPrev - fCur);
      vec3 x = lerpX(prev, cur, f);
      float g = sphereGrid(x.y, x.z, 0.05, 12.0, 24.0);
      col += vec3(0.95, 0.45, 0.15) * g * u_layerOpacity;
    }
  }

  // --- Esfera de fotones: r = r_ph (orbita circular ecuatorial prograda) ----
  if (u_showPhotonSphere) {
    float fPrev = prev.x - u_photonRadius;
    float fCur = cur.x - u_photonRadius;
    if (fPrev * fCur < 0.0) {
      float f = fPrev / (fPrev - fCur);
      vec3 x = lerpX(prev, cur, f);
      float g = sphereGrid(x.y, x.z, 0.04, 10.0, 20.0);
      col += vec3(0.35, 0.85, 1.0) * g * u_layerOpacity * 0.8;
    }
  }

  // --- Malla de coordenadas: muestra el arrastre de marcos ------------------
  if (u_showDragGrid) {
    float fPrev = prev.x - u_dragGridRadius;
    float fCur = cur.x - u_dragGridRadius;
    if (fPrev * fCur < 0.0) {
      float f = fPrev / (fPrev - fCur);
      vec3 x = lerpX(prev, cur, f);
      float g = sphereGrid(x.y, x.z, 0.03, 8.0, 16.0);
      // La intensidad se modula con omega para que se lea donde el arrastre
      // es fuerte.
      float drag = knFrameDragging(x.x, sin(x.y));
      col += mix(vec3(0.3, 0.35, 0.5), vec3(0.9, 0.3, 0.7), clamp(drag * 8.0, 0.0, 1.0)) *
             g * u_layerOpacity * 0.5;
    }
  }

  return col;
}

/** Rejilla sobre el horizonte, en el punto donde el rayo es capturado. */
vec3 horizonGrid(vec3 x) {
  if (!u_showHorizon || u_layerOpacity <= 0.0) return vec3(0.0);
  float g = sphereGrid(x.y, x.z, 0.045, 12.0, 24.0);
  return vec3(0.55, 0.15, 0.35) * g * u_layerOpacity;
}

/**
 * Anillo del ISCO en el plano ecuatorial. Se evalua en cada cruce del plano,
 * asi que se ve tanto directamente como en las imagenes de orden superior.
 */
vec3 iscoRing(float r) {
  if (!u_showIsco || u_layerOpacity <= 0.0) return vec3(0.0);
  float w = 0.035 * max(u_iscoRadius, 1.0);
  float d = abs(r - u_iscoRadius);
  float m = 1.0 - smoothstep(w * 0.4, w, d);
  return vec3(0.4, 1.0, 0.55) * m * u_layerOpacity;
}
