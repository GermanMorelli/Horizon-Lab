#version 300 es
precision highp float;

out vec2 vUv;

/**
 * Triangulo a pantalla completa sin buffers de vertices: los tres vertices
 * (-1,-1), (3,-1), (-1,3) cubren el cuadrado [-1,1]^2 con un solo triangulo,
 * que ahorra el vertice extra y la costura diagonal de dos triangulos.
 */
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
