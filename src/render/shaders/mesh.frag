#version 300 es
precision highp float;

uniform float u_opacity;

in vec3 vColor;
in float vFade;
out vec4 fragColor;

/** Codificacion sRGB: se dibuja directamente al canvas, sin pasar por el tonemap. */
vec3 linearToSrgb(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  float a = u_opacity * vFade;
  if (a <= 0.002) discard;
  fragColor = vec4(linearToSrgb(vColor) * a, a);
}
