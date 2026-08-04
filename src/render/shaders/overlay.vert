#version 300 es
precision highp float;

// Lineas del overlay de orbitas. La proyeccion se hace en CPU (son unos pocos
// miles de puntos), asi que aqui llegan ya en NDC: el shader solo transporta.

layout(location = 0) in vec2 aPos;   // NDC, [-1, 1]
layout(location = 1) in float aFade; // 0 = oculto por el agujero, 1 = visible

out float vFade;

void main() {
  vFade = aFade;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
