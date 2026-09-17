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
  float radialT = clamp((r - inner) / max(outer - inner, 0.001), 0.0, 1.0);
  float edgeOuter = arcMask(p, outer, 0.0022, centerAngle, span);
  float edgeInner = arcMask(p, inner, 0.0013, centerAngle, span);
  float edgeA = 1.0 - smoothstep(span * 0.5 - 0.012, span * 0.5, abs(atan(sin(angle - centerAngle), cos(angle - centerAngle))));
  float filament = 0.45 + 0.55 * sin((angle - centerAngle) * 22.0 + radialT * 10.0 + variation);
  float scan = 0.5 + 0.5 * sin(r * 175.0 + angle * 8.0 + variation);
  vec3 glass = HUD_CYAN_DARK * (0.30 + scan * 0.06) * mask;
  glass += HUD_CYAN * mask * smoothstep(0.18, 0.67, radialT) * (1.0 - smoothstep(0.76, 0.98, radialT)) * filament * 0.20;
  glass += HUD_CYAN_BRIGHT * mask * smoothstep(0.70, 0.98, radialT) * 0.15;
  vec3 edge = HUD_CYAN * edgeOuter * (0.72 + scan * 0.12) + HUD_CYAN_BRIGHT * edgeInner * 0.36;
  edge += vec3(0.86, 1.0, 1.0) * edgeOuter * 0.44;
  edge += HUD_CYAN * arcGlow(p, outer, 0.0048, centerAngle, span) * 0.12;
  edge += HUD_CYAN_BRIGHT * edgeA * (0.12 + 0.10 * scan) * mask;
  return glass + edge;
}

vec3 panelWebPaint(vec2 p, float inner, float outer, float centerAngle, float span, float t) {
  vec3 color = vec3(0.0);
  float mask = glassPanelMask(p, inner, outer, centerAngle, span);
  float mid = mix(inner, outer, 0.52);
  color += HUD_CYAN * arcMask(p, mix(inner, outer, 0.34), 0.0009, centerAngle, span * 0.82) * mask * 0.32;
  color += HUD_CYAN_BRIGHT * arcMask(p, mid, 0.0008, centerAngle, span * 0.74) * mask * 0.28;
  for (int i = 0; i < 4; i++) {
    float offset = (float(i) - 1.5) * span * 0.16;
    vec2 d = vec2(cos(centerAngle + offset), sin(centerAngle + offset));
    color += HUD_CYAN * capsule(p, d * (inner + 0.008), d * (outer - 0.008), 0.00085) * mask * 0.36;
  }
  for (int i = 0; i < 3; i++) {
    float offset = (float(i) - 1.0) * span * 0.24 + 0.06 * sin(float(i));
    vec2 a = vec2(cos(centerAngle + offset), sin(centerAngle + offset)) * (inner + 0.018);
    vec2 b = vec2(cos(centerAngle + offset + span * 0.15), sin(centerAngle + offset + span * 0.15)) * (outer - 0.016);
    color += HUD_CYAN_DARK * capsule(p, a, b, 0.0011) * mask * 0.72;
    color += HUD_CYAN * pointMask(p, mix(a, b, 0.52), 0.0030) * mask * 0.38;
  }
  return color;
}

vec3 layerPanels(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float r2 = dot(p, p);
  if (r2 < 0.205 || r2 > 0.640) return color;
  float spin = t * 0.006;
  color += panelPaint(p, 0.570, 0.675, 0.25 + spin, 0.54, 0.8, t);
  color += panelPaint(p, 0.570, 0.675, 2.18 - spin, 0.38, 1.7, t);
  color += panelPaint(p, 0.570, 0.675, 3.82 + spin, 0.46, 2.5, t);
  color += panelPaint(p, 0.570, 0.675, 5.38 - spin, 0.34, 3.2, t);
  color += panelPaint(p, 0.700, 0.790, 1.20 - spin, 0.30, 4.2, t);
  color += panelPaint(p, 0.700, 0.790, 3.42 + spin, 0.40, 5.3, t);
  color += panelPaint(p, 0.700, 0.790, 5.10 - spin, 0.26, 6.1, t);
  color += panelPaint(p, 0.468, 0.526, 0.92 + spin, 0.42, 7.0, t);
  color += panelPaint(p, 0.490, 0.548, 3.58 - spin, 0.36, 7.8, t);

  color += panelWebPaint(p, 0.570, 0.675, 0.25 + spin, 0.54, t);
  color += panelWebPaint(p, 0.570, 0.675, 3.82 + spin, 0.46, t);
  color += panelWebPaint(p, 0.700, 0.790, 3.42 + spin, 0.40, t);
  color += panelWebPaint(p, 0.468, 0.526, 0.92 + spin, 0.42, t);

  // Sparse internal panel etching: cheap short radial marks, not a texture.
  color += HUD_CYAN * radialDash(p, 0.625, 76.0, 0.23, 0.0013, spin) * 0.48;
  color += HUD_CYAN_BRIGHT * radialDash(p, 0.745, 58.0, 0.18, 0.0015, -spin) * 0.35;
  return color;
}
