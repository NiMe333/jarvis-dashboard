// -----------------------------------------------------------------------------
// JARVIS HUD — Panels layer
// Asymmetric outer panels extend beyond the main ring to break the silhouette.
// -----------------------------------------------------------------------------

const vec3 PANEL_ORANGE_DARK = vec3(0.16, 0.050, 0.006);
const vec3 PANEL_ORANGE      = vec3(1.00, 0.270, 0.025);
const vec3 PANEL_AMBER       = vec3(1.00, 0.540, 0.090);
const vec3 PANEL_WARM        = vec3(1.00, 0.860, 0.580);

float glassPanelMask(vec2 p, float inner, float outer, float centerAngle, float span) {
  float r = length(p);
  float radial =
    smoothstep(inner, inner + 0.012, r)
    * (1.0 - smoothstep(outer - 0.012, outer, r));

  float angle = atan(p.y, p.x);
  float delta = abs(atan(
    sin(angle - centerAngle),
    cos(angle - centerAngle)
  ));

  float edge = 0.006 / max(r, 0.25);

  return radial
    * (1.0 - smoothstep(
      span * 0.5,
      span * 0.5 + edge,
      delta
    ));
}

float panelHexagonOutline(vec2 p, vec2 center, float size, float thickness) {
  vec2 q = abs(p - center);
  float hexDistance = max(
    q.x * 0.8660254 + q.y * 0.5,
    q.y
  );

  return 1.0 - smoothstep(
    thickness,
    thickness * 2.0,
    abs(hexDistance - size)
  );
}

vec3 panelPaint(
  vec2 p,
  float inner,
  float outer,
  float centerAngle,
  float span,
  float variation,
  float warmMix,
  float t
) {
  float mask = glassPanelMask(
    p,
    inner,
    outer,
    centerAngle,
    span
  );

  float r = length(p);
  float angle = atan(p.y, p.x);
  float radialT = clamp(
    (r - inner) / max(outer - inner, 0.001),
    0.0,
    1.0
  );

  float edgeOuter = arcMask(
    p,
    outer,
    0.0022,
    centerAngle,
    span
  );

  float edgeInner = arcMask(
    p,
    inner,
    0.0013,
    centerAngle,
    span
  );

  float edgeA = 1.0 - smoothstep(
    span * 0.5 - 0.012,
    span * 0.5,
    abs(atan(
      sin(angle - centerAngle),
      cos(angle - centerAngle)
    ))
  );

  float filament = 0.45 + 0.55 * sin(
    (angle - centerAngle) * 22.0
    + radialT * 10.0
    + variation
  );

  float scan = 0.5 + 0.5 * sin(
    r * 175.0
    + angle * 8.0
    + variation
    + t * 0.08
  );

  vec3 darkTone = mix(
    HUD_CYAN_DARK,
    PANEL_ORANGE_DARK,
    warmMix
  );

  vec3 mainTone = mix(
    HUD_CYAN,
    PANEL_ORANGE,
    warmMix
  );

  vec3 brightTone = mix(
    HUD_CYAN_BRIGHT,
    PANEL_AMBER,
    warmMix
  );

  vec3 hotTone = mix(
    vec3(0.86, 1.0, 1.0),
    PANEL_WARM,
    warmMix
  );

  vec3 glass =
    darkTone
    * (0.30 + scan * 0.06)
    * mask;

  glass +=
    mainTone
    * mask
    * smoothstep(0.18, 0.67, radialT)
    * (1.0 - smoothstep(0.76, 0.98, radialT))
    * filament
    * 0.20;

  glass +=
    brightTone
    * mask
    * smoothstep(0.70, 0.98, radialT)
    * 0.15;

  vec3 edge =
    mainTone
    * edgeOuter
    * (0.72 + scan * 0.12);

  edge +=
    brightTone
    * edgeInner
    * 0.36;

  edge +=
    hotTone
    * edgeOuter
    * 0.44;

  edge +=
    mainTone
    * arcGlow(
      p,
      outer,
      0.0048,
      centerAngle,
      span
    )
    * 0.12;

  edge +=
    brightTone
    * edgeA
    * (0.12 + 0.10 * scan)
    * mask;

  return glass + edge;
}

vec3 panelWebPaint(
  vec2 p,
  float inner,
  float outer,
  float centerAngle,
  float span,
  float variation,
  float warmMix,
  float t
) {
  vec3 color = vec3(0.0);

  float mask = glassPanelMask(
    p,
    inner,
    outer,
    centerAngle,
    span
  );

  vec3 darkTone = mix(
    HUD_CYAN_DARK,
    PANEL_ORANGE_DARK,
    warmMix
  );

  vec3 mainTone = mix(
    HUD_CYAN,
    PANEL_ORANGE,
    warmMix
  );

  vec3 brightTone = mix(
    HUD_CYAN_BRIGHT,
    PANEL_AMBER,
    warmMix
  );

  float pulse = 0.88 + 0.12 * sin(
    t * 0.70 + variation
  );

  // Two clean internal arcs replace the former X/N-like construction.
  color +=
    mainTone
    * arcMask(
      p,
      mix(inner, outer, 0.32),
      0.0009,
      centerAngle,
      span * 0.80
    )
    * mask
    * 0.31;

  color +=
    brightTone
    * arcMask(
      p,
      mix(inner, outer, 0.66),
      0.0008,
      centerAngle,
      span * 0.68
    )
    * mask
    * 0.27;

  // Three slightly fanned lines point toward the core.
  for (int i = 0; i < 3; i++) {
    float fi = float(i) - 1.0;
    float lineAngle = centerAngle + fi * span * 0.18;

    vec2 direction = vec2(
      cos(lineAngle),
      sin(lineAngle)
    );

    vec2 a = direction * (inner + 0.010);
    vec2 b = direction * mix(inner, outer, 0.78);

    color +=
      mainTone
      * capsule(p, a, b, 0.0009)
      * mask
      * (0.30 - abs(fi) * 0.045)
      * pulse;
  }

  // Offset hexagonal detail gives the larger panels a deliberate focal mark.
  vec2 radialDirection = vec2(
    cos(centerAngle),
    sin(centerAngle)
  );

  vec2 tangentDirection = vec2(
    -radialDirection.y,
    radialDirection.x
  );

  vec2 hexCenter =
    radialDirection * mix(inner, outer, 0.62)
    + tangentDirection * sin(variation * 1.73) * span * 0.030;

  float hexagon = panelHexagonOutline(
    p,
    hexCenter,
    min(0.020, (outer - inner) * 0.22),
    0.0010
  );

  color +=
    brightTone
    * hexagon
    * mask
    * 0.55
    * pulse;

  color +=
    mainTone
    * pointMask(p, hexCenter, 0.0022)
    * mask
    * 0.54;

  // Small core-facing connector beneath the hexagon.
  vec2 connectorEnd =
    radialDirection * mix(inner, outer, 0.43);

  color +=
    darkTone
    * capsule(
      p,
      connectorEnd,
      hexCenter - radialDirection * 0.012,
      0.0011
    )
    * mask
    * 0.75;

  return color;
}

vec3 layerPanels(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float r2 = dot(p, p);

  // 0.922 radius limit includes the longest 0.915 outer panel.
  if (r2 < 0.185 || r2 > 0.850) {
    return color;
  }

  float spin = t * 0.0124;
  float counterSpin = -t * 0.0091;

  // ---------------------------------------------------------------------------
  // Inner panels
  // ---------------------------------------------------------------------------

  color += panelPaint(
    p, 0.468, 0.526,
    0.92 + spin,
    0.42, 7.0, 0.00, t
  );

  color += panelPaint(
    p, 0.490, 0.548,
    3.58 + counterSpin,
    0.36, 7.8, 0.68, t
  );

  color += panelWebPaint(
    p, 0.468, 0.526,
    0.92 + spin,
    0.42, 7.0, 0.00, t
  );

  // ---------------------------------------------------------------------------
  // Middle panels
  // ---------------------------------------------------------------------------

  color += panelPaint(
    p, 0.570, 0.675,
    0.25 + spin,
    0.54, 0.8, 0.00, t
  );

  color += panelPaint(
    p, 0.570, 0.675,
    2.18 + counterSpin,
    0.38, 1.7, 0.82, t
  );

  color += panelPaint(
    p, 0.570, 0.675,
    3.82 + spin,
    0.46, 2.5, 0.00, t
  );

  color += panelPaint(
    p, 0.570, 0.675,
    5.38 + counterSpin,
    0.34, 3.2, 0.58, t
  );

  color += panelWebPaint(
    p, 0.570, 0.675,
    0.25 + spin,
    0.54, 0.8, 0.00, t
  );

  color += panelWebPaint(
    p, 0.570, 0.675,
    2.18 + counterSpin,
    0.38, 1.7, 0.82, t
  );

  color += panelWebPaint(
    p, 0.570, 0.675,
    3.82 + spin,
    0.46, 2.5, 0.00, t
  );

  color += panelWebPaint(
    p, 0.570, 0.675,
    5.38 + counterSpin,
    0.34, 3.2, 0.58, t
  );

  // ---------------------------------------------------------------------------
  // Five asymmetric outer panels
  // Different outer radii create a stepped, intentionally broken silhouette.
  // ---------------------------------------------------------------------------

  // Long cyan panel — strongly protrudes.
  color += panelPaint(
    p, 0.695, 0.885,
    0.22 + spin,
    0.56, 4.2, 0.00, t
  );

  // Shorter narrow orange panel.
  color += panelPaint(
    p, 0.710, 0.848,
    1.52 + counterSpin,
    0.34, 5.1, 0.92, t
  );

  // Longest cyan panel.
  color += panelPaint(
    p, 0.700, 0.905,
    2.72 + spin,
    0.44, 6.0, 0.08, t
  );

  // Wide orange panel, slightly shorter than the cyan peaks.
  color += panelPaint(
    p, 0.692, 0.868,
    4.02 + counterSpin,
    0.62, 6.9, 0.86, t
  );

  // Slim blue-white blade — furthest protruding element.
  color += panelPaint(
    p, 0.718, 0.915,
    5.42 + spin,
    0.30, 8.1, 0.12, t
  );

  color += panelWebPaint(
    p, 0.695, 0.885,
    0.22 + spin,
    0.56, 4.2, 0.00, t
  );

  color += panelWebPaint(
    p, 0.710, 0.848,
    1.52 + counterSpin,
    0.34, 5.1, 0.92, t
  );

  color += panelWebPaint(
    p, 0.700, 0.905,
    2.72 + spin,
    0.44, 6.0, 0.08, t
  );

  color += panelWebPaint(
    p, 0.692, 0.868,
    4.02 + counterSpin,
    0.62, 6.9, 0.86, t
  );

  color += panelWebPaint(
    p, 0.718, 0.915,
    5.42 + spin,
    0.30, 8.1, 0.12, t
  );

  // Bright end caps emphasize the uneven outer silhouette.
  color += HUD_CYAN_BRIGHT
    * arcGlow(p, 0.885, 0.0065, 0.22 + spin, 0.12)
    * 0.24;

  color += PANEL_AMBER
    * arcGlow(p, 0.868, 0.0060, 4.02 + counterSpin, 0.14)
    * 0.28;

  color += HUD_CYAN_BRIGHT
    * arcGlow(p, 0.915, 0.0070, 5.42 + spin, 0.10)
    * 0.30;

  // Sparse etching remains behind the panels and avoids visual overload.
  color += HUD_CYAN
    * radialDash(
      p,
      0.625,
      62.0,
      0.18,
      0.0012,
      spin
    )
    * 0.34;

  color += HUD_CYAN_BRIGHT
    * radialDash(
      p,
      0.744,
      46.0,
      0.15,
      0.0014,
      counterSpin
    )
    * 0.26;

  return color;
}
