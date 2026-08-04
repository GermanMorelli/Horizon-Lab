// ---------------------------------------------------------------------------
// Metrica de Brill-Lindquist y geodesicas nulas, en cartesianas isotropas.
//
// Espejo en GLSL de `src/physics/binary.ts`, que es el que esta validado contra
// resultados analiticos (con m2 = 0 debe reproducir sqrt(27) M). Cualquier cambio
// aqui hay que replicarlo alli.
//
//   psi = 1 + m1/(2 r1) + m2/(2 r2)
//   ds^2 = -alpha^2 dt^2 + psi^4 (dx^2 + dy^2 + dz^2),   alpha = 2/psi - 1
//
// Con dos punturas se pierde la simetria axial: no hay analogo de L y hay que
// integrar las tres componentes del momento. A cambio la metrica es estatica, asi
// que E = -p_t sigue siendo constante, y al ser conformemente plana solo hacen
// falta psi y su gradiente.
// ---------------------------------------------------------------------------

uniform vec3 u_bh1Pos;
uniform vec3 u_bh2Pos;
uniform float u_bh1Mass;
uniform float u_bh2Mass;

/** Estado de un rayo: posicion y momento covariante espacial. */
struct BinState {
  vec3 x;
  vec3 p;
};

/** psi = 1 + sum m_i/(2 r_i). */
float blPsi(vec3 x) {
  float r1 = max(length(x - u_bh1Pos), 1e-6);
  float r2 = max(length(x - u_bh2Pos), 1e-6);
  return 1.0 + u_bh1Mass / (2.0 * r1) + u_bh2Mass / (2.0 * r2);
}

/** Gradiente de psi. Apunta hacia las masas, porque psi crece al acercarse. */
vec3 blGradPsi(vec3 x) {
  vec3 d1 = x - u_bh1Pos;
  vec3 d2 = x - u_bh2Pos;
  float r1 = max(length(d1), 1e-6);
  float r2 = max(length(d2), 1e-6);
  return -u_bh1Mass * d1 / (2.0 * r1 * r1 * r1)
         - u_bh2Mass * d2 / (2.0 * r2 * r2 * r2);
}

/** Lapso alpha = 2/psi - 1: vale 1 en el infinito y 0 en el horizonte (psi = 2). */
float blLapse(float psi) {
  return 2.0 / psi - 1.0;
}

/** Distancia a la puntura mas cercana, para limitar el paso. */
float blNearest(vec3 x) {
  return min(length(x - u_bh1Pos), length(x - u_bh2Pos));
}

/**
 * Lado derecho:
 *   dx^i/dl = p_i / psi^4
 *   dp_i/dl = -E^2 d_i(alpha)/alpha^3 + 2 |p|^2 d_i(psi)/psi^5
 * con d_i(alpha) = -2 d_i(psi)/psi^2.
 */
BinState blRHS(BinState s, float E) {
  float psi = blPsi(s.x);
  vec3 gp = blGradPsi(s.x);
  float a = blLapse(psi);
  vec3 ga = -2.0 * gp / (psi * psi);

  float psi4 = psi * psi * psi * psi;
  float psi5 = psi4 * psi;
  float p2 = dot(s.p, s.p);
  float a3 = a * a * a;

  BinState d;
  d.x = s.p / psi4;
  d.p = -(E * E) * ga / a3 + 2.0 * p2 * gp / psi5;
  return d;
}

/** Paso Cash-Karp 4(5). Mismos coeficientes que el trazador de Kerr-Newman. */
BinState blStep(BinState s, float h, float E, out float errOut) {
  BinState k1 = blRHS(s, E);

  BinState y2; y2.x = s.x + h * 0.2 * k1.x; y2.p = s.p + h * 0.2 * k1.p;
  BinState k2 = blRHS(y2, E);

  BinState y3;
  y3.x = s.x + h * (0.075 * k1.x + 0.225 * k2.x);
  y3.p = s.p + h * (0.075 * k1.p + 0.225 * k2.p);
  BinState k3 = blRHS(y3, E);

  BinState y4;
  y4.x = s.x + h * (0.3 * k1.x - 0.9 * k2.x + 1.2 * k3.x);
  y4.p = s.p + h * (0.3 * k1.p - 0.9 * k2.p + 1.2 * k3.p);
  BinState k4 = blRHS(y4, E);

  const float B51 = -11.0 / 54.0, B52 = 2.5, B53 = -70.0 / 27.0, B54 = 35.0 / 27.0;
  BinState y5;
  y5.x = s.x + h * (B51 * k1.x + B52 * k2.x + B53 * k3.x + B54 * k4.x);
  y5.p = s.p + h * (B51 * k1.p + B52 * k2.p + B53 * k3.p + B54 * k4.p);
  BinState k5 = blRHS(y5, E);

  const float B61 = 1631.0 / 55296.0, B62 = 175.0 / 512.0, B63 = 575.0 / 13824.0;
  const float B64 = 44275.0 / 110592.0, B65 = 253.0 / 4096.0;
  BinState y6;
  y6.x = s.x + h * (B61 * k1.x + B62 * k2.x + B63 * k3.x + B64 * k4.x + B65 * k5.x);
  y6.p = s.p + h * (B61 * k1.p + B62 * k2.p + B63 * k3.p + B64 * k4.p + B65 * k5.p);
  BinState k6 = blRHS(y6, E);

  const float C1 = 37.0 / 378.0, C3 = 250.0 / 621.0, C4 = 125.0 / 594.0, C6 = 512.0 / 1771.0;
  const float D1 = 2825.0 / 27648.0, D3 = 18575.0 / 48384.0, D4 = 13525.0 / 55296.0;
  const float D5 = 277.0 / 14336.0, D6 = 0.25;

  BinState o;
  o.x = s.x + h * (C1 * k1.x + C3 * k3.x + C4 * k4.x + C6 * k6.x);
  o.p = s.p + h * (C1 * k1.p + C3 * k3.p + C4 * k4.p + C6 * k6.p);

  vec3 x4 = s.x + h * (D1 * k1.x + D3 * k3.x + D4 * k4.x + D5 * k5.x + D6 * k6.x);
  vec3 p4 = s.p + h * (D1 * k1.p + D3 * k3.p + D4 * k4.p + D5 * k5.p + D6 * k6.p);

  // Error mixto absoluto/relativo: el suelo evita que una componente nula limite
  // el paso de forma permanente (ver la nota de ERR_FLOOR en geodesic.ts).
  vec3 ex = abs(o.x - x4) / (abs(s.x) + abs(o.x) + 1e-3);
  vec3 ep = abs(o.p - p4) / (abs(s.p) + abs(o.p) + 1e-3);
  errOut = max(max(max(ex.x, ex.y), ex.z), max(max(ep.x, ep.y), ep.z));

  return o;
}

/**
 * Construye un foton con energia local unidad en el marco del observador estatico.
 * La tetrada es e_0 = (1/alpha) d_t, e_i = (1/psi^2) d_i, de donde E = alpha y
 * p_i = psi^2 dir_i, que da un momento nulo por construccion.
 */
BinState blPhoton(vec3 x, vec3 dir, out float E) {
  float psi = blPsi(x);
  E = blLapse(psi);
  BinState s;
  s.x = x;
  s.p = psi * psi * normalize(dir);
  return s;
}
