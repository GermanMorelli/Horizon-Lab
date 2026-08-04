#version 300 es
precision highp float;

// Bloom en dos etapas sobre un objetivo a media resolucion:
//   u_mode = 0 -> paso de brillo (extrae lo que supera el umbral)
//   u_mode = 1 -> desenfoque gaussiano separable en la direccion u_dir
//
// Su razon de ser es el anillo de fotones: concentra mucha energia en muy pocos
// pixeles, y sin bloom el tonemap lo recorta a blanco plano perdiendo su forma.

uniform sampler2D u_src;
uniform vec2 u_texel; // 1 / tamano de la textura fuente
uniform vec2 u_resolution;
uniform vec2 u_dir; // (1,0) horizontal, (0,1) vertical
uniform float u_threshold;
uniform int u_mode;

out vec4 fragColor;

/** Pesos gaussianos de 9 muestras (sigma ~ 2.2 px). */
const float W0 = 0.2270270270;
const float W1 = 0.1945945946;
const float W2 = 0.1216216216;
const float W3 = 0.0540540541;
const float W4 = 0.0162162162;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  if (u_mode == 0) {
    vec3 c = texture(u_src, uv).rgb;
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // Recorte suave: evita que el bloom aparezca de golpe en el umbral.
    float w = luma <= 0.0 ? 0.0 : max(luma - u_threshold, 0.0) / luma;
    fragColor = vec4(c * w * w, 1.0);
    return;
  }

  vec2 o = u_texel * u_dir;
  vec3 sum = texture(u_src, uv).rgb * W0;
  sum += (texture(u_src, uv + o * 1.0).rgb + texture(u_src, uv - o * 1.0).rgb) * W1;
  sum += (texture(u_src, uv + o * 2.0).rgb + texture(u_src, uv - o * 2.0).rgb) * W2;
  sum += (texture(u_src, uv + o * 3.0).rgb + texture(u_src, uv - o * 3.0).rgb) * W3;
  sum += (texture(u_src, uv + o * 4.0).rgb + texture(u_src, uv - o * 4.0).rgb) * W4;
  fragColor = vec4(sum, 1.0);
}
