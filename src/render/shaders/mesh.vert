#version 300 es
precision highp float;

// Malla del espaciotiempo: lineas en NDC con color por vertice.
// La proyeccion se hace en CPU (unos pocos miles de vertices), asi que aqui llegan
// ya proyectadas.

layout(location = 0) in vec2 aPos;   // NDC
layout(location = 1) in vec3 aColor; // color lineal por vertice
layout(location = 2) in float aFade; // profundidad/atenuacion

out vec3 vColor;
out float vFade;

void main() {
  vColor = aColor;
  vFade = aFade;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
