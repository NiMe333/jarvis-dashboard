vec3 layerGrid(vec2 p, float t) {
  vec2 minorCell = abs(fract(p * 10.0 + 0.5) - 0.5);
  vec2 majorCell = abs(fract(p * 4.0 + 0.5) - 0.5);
  float minor = 1.0 - smoothstep(0.0, 0.010, min(minorCell.x, minorCell.y));
  float major = 1.0 - smoothstep(0.0, 0.014, min(majorCell.x, majorCell.y));
  float fade = 1.0 - smoothstep(0.74, 1.42, length(p));
  return HUD_CYAN_DARK * minor * 0.055 * fade + HUD_CYAN * major * 0.040 * fade;
}
