#version 300 es
precision highp float;

// Tonemap final: exposicion -> bloom -> ACES -> codificacion sRGB -> dither.

uniform sampler2D u_accum;
uniform sampler2D u_bloom;
uniform vec2 u_resolution;
uniform float u_exposure;
uniform float u_bloomStrength;
uniform bool u_bloomEnabled;

out vec4 fragColor;

/** Aproximacion filmica de ACES (Narkowicz 2015). */
vec3 acesFilmic(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

/** Codificacion sRGB (el framebuffer por defecto no la aplica). */
vec3 linearToSrgb(vec3 c) {
  c = max(c, vec3(0.0));
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}

float dither(vec2 p) {
  // Ruido de interleaved gradient (Jimenez 2014): rompe el banding a 8 bits.
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_accum, uv).rgb;

  if (u_bloomEnabled) {
    color += texture(u_bloom, uv).rgb * u_bloomStrength;
  }

  color *= u_exposure;
  color = acesFilmic(color);
  color = linearToSrgb(color);

  // El dither se aplica en el espacio de salida, a escala de 1 LSB.
  color += (dither(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(color, 1.0);
}
