float glassPanelMask(vec2 p, float inner, float outer, float centerAngle, float span) {
  float r = length(p);
  float radial = smoothstep(inner, inner + 0.012, r) * (1.0 - smoothstep(outer - 0.012, outer, r));
  float angle = atan(p.y, p.x);
  float delta = abs(atan(sin(angle - centerAngle), cos(angle - centerAngle)));
  float edge = 0.006 / max(r, 0.25);
  return radial * (1.0 - smoothstep(span * 0.5, span * 0.5 + edge, delta));
}

vec3 panelPaint(vec2 p, float inner, float outer, float centerAngle, float span, float variation, float t) {
  float mask = glassPanelMask(p, inner, outer, centerAngle, span);
  float r = length(p);
  float angle = atan(p.y, p.x);
  float edgeOuter = arcMask(p, outer, 0.0034, centerAngle, span);
  float edgeInner = arcMask(p, inner, 0.0015, centerAngle, span);
  float edgeA = 1.0 - smoothstep(span * 0.5 - 0.012, span * 0.5, abs(atan(sin(angle - centerAngle), cos(angle - centerAngle))));
  float scan = 0.5 + 0.5 * sin(r * 175.0 + angle * 8.0 + t * 0.08 + variation);
  vec3 glass = HUD_CYAN_DARK * (0.27 + scan * 0.07 + variation * 0.025) * mask;
  vec3 edge = HUD_CYAN * edgeOuter * (0.62 + scan * 0.16) + HUD_CYAN_BRIGHT * edgeInner * 0.42;
  edge += HUD_CYAN_BRIGHT * edgeA * (0.12 + 0.10 * scan) * mask;
  return glass + edge;
}

vec3 layerPanels(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float spin = t * 0.010;
  color += panelPaint(p, 0.570, 0.675, 0.25 + spin, 0.54, 0.8, t);
  color += panelPaint(p, 0.570, 0.675, 2.18 - spin, 0.38, 1.7, t);
  color += panelPaint(p, 0.570, 0.675, 3.82 + spin, 0.46, 2.5, t);
  color += panelPaint(p, 0.570, 0.675, 5.38 - spin, 0.34, 3.2, t);
  color += panelPaint(p, 0.700, 0.790, 1.20 - spin, 0.30, 4.2, t);
  color += panelPaint(p, 0.700, 0.790, 3.42 + spin, 0.40, 5.3, t);
  color += panelPaint(p, 0.700, 0.790, 5.10 - spin, 0.26, 6.1, t);

  // Sparse internal panel etching: cheap short radial marks, not a texture.
  color += HUD_CYAN * radialDash(p, 0.625, 76.0, 0.23, 0.0013, spin) * 0.48;
  color += HUD_CYAN_BRIGHT * radialDash(p, 0.745, 58.0, 0.18, 0.0015, -spin) * 0.35;
  return color;
}
