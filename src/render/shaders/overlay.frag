#version 300 es
precision highp float;

uniform vec3 u_color;
uniform float u_opacity;

in float vFade;
out vec4 fragColor;

void main() {
  float a = u_opacity * vFade;
  if (a <= 0.002) discard;
  // Se emite premultiplicado y se compone con blending aditivo sobre la imagen ya
  // tonemapeada, de modo que las lineas no oscurezcan lo que hay detras.
  fragColor = vec4(u_color * a, a);
}
