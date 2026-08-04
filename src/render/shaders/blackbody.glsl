// ---------------------------------------------------------------------------
// LUT de cuerpo negro compartida.
//
// Se extrae de disk.glsl para que la use tambien el trazador de la binaria, que
// necesita el color de las estrellas del fondo pero no el disco de acrecion.
//
// El fichero .frag debe incluirlo UNA sola vez y antes de disk.glsl o
// starfield.glsl: el preprocesador de #include no deduplica, e incluirlo dos veces
// duplicaria las declaraciones de uniforms y no compilaria.
// ---------------------------------------------------------------------------

uniform sampler2D u_bbLUT;   // RGB = cromaticidad, A = log10(radiancia visible)
uniform float u_lutLogTMin;
uniform float u_lutLogTMax;

const float LN10 = 2.302585092994046;

/**
 * Emision visible de un cuerpo negro a temperatura T (kelvin), en RGB lineal.
 *
 * La LUT guarda la cromaticidad con luminancia unidad y, en el canal alfa, el
 * log10 de la radiancia visible relativa: en logaritmo la interpolacion lineal de
 * la textura es fiel a lo largo de las ~20 decadas que cubre el rango.
 */
vec3 blackbodyEmission(float T) {
  if (T <= 0.0) return vec3(0.0);
  float logT = log(T) / LN10;
  float idx = (logT - u_lutLogTMin) / (u_lutLogTMax - u_lutLogTMin);
  vec4 s = texture(u_bbLUT, vec2(clamp(idx, 0.001, 0.999), 0.5));
  return s.rgb * pow(10.0, s.a);
}
