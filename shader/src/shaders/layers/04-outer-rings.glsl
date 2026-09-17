// Penultimate housing: fragmented mechanical structure around the locked inner assembly.
const vec3 OUTER_DEEP_BLUE = vec3(0.002, 0.075, 0.115);
const vec3 OUTER_BLUE = vec3(0.00, 0.29, 0.39);
const vec3 OUTER_CYAN_DIM = vec3(0.00, 0.52, 0.66);
const vec3 OUTER_ICE = vec3(0.48, 0.94, 1.00);
const vec3 OUTER_AMBER = vec3(1.00, 0.56, 0.19);
const vec3 OUTER_WARM = vec3(1.00, 0.78, 0.48);
const vec3 OUTER_HOT = vec3(0.92, 1.00, 1.00);

float outerBand(vec2 p, float innerRadius, float outerRadius) {
  float r = length(p);
  return smoothstep(innerRadius, innerRadius + 0.006, r)
    * (1.0 - smoothstep(outerRadius - 0.006, outerRadius, r));
}

float outerSector(vec2 p, float angle, float span) {
  float a = atan(p.y, p.x);
  float delta = abs(atan(sin(a - angle), cos(a - angle)));
  return 1.0 - smoothstep(span * 0.5, span * 0.5 + 0.016, delta);
}

vec3 outerArc(vec2 p, float radius, float width, float angle, float span, vec3 tint, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float bloom = arcGlow(p, radius, width, angle, span);
  return tint * sharp * strength + tint * bloom * 0.12 * uGlowIntensity;
}

vec3 outerTransitionRail(vec2 p, float radius, float angle, float span, vec3 deepTint, vec3 mainTint, vec3 highlightTint, float strength) {
  float body = arcMask(p, radius, 0.0100, angle, span);
  float core = arcMask(p, radius, 0.0030, angle, span);
  float halo = arcGlow(p, radius, 0.0190, angle, span);
  return deepTint * body * 0.44 * strength
    + mainTint * body * 0.78 * strength
    + highlightTint * core * 0.86 * strength
    + mainTint * halo * 0.15 * strength;
}

vec3 outerPanel(vec2 p, float innerRadius, float outerRadius, float angle, float span, vec3 fillTint, vec3 edgeTint, float strength) {
  float panel = outerBand(p, innerRadius, outerRadius) * outerSector(p, angle, span);
  float midRadius = (innerRadius + outerRadius) * 0.5;
  float radialT = clamp((length(p) - innerRadius) / max(outerRadius - innerRadius, 0.001), 0.0, 1.0);
  float midDistance = (length(p) - midRadius) / max((outerRadius - innerRadius) * 0.56, 0.012);
  float midLight = exp(-(midDistance * midDistance));
  float a = atan(p.y, p.x);
  float filament = 0.48 + 0.52 * sin((a - angle) * 18.0 + radialT * 7.0);
  float cyanFilament = smoothstep(0.18, 0.62, radialT) * (1.0 - smoothstep(0.74, 0.98, radialT));
  float innerEdge = arcMask(p, innerRadius, 0.0038, angle, span);
  float outerEdge = arcMask(p, outerRadius, 0.0052, angle, span);
  float halo = arcGlow(p, outerRadius, 0.0070, angle, span);
  return OUTER_DEEP_BLUE * panel * 0.86
    + fillTint * panel * midLight * 0.26 * strength
    + HUD_CYAN * panel * cyanFilament * filament * 0.16 * strength
    + OUTER_ICE * panel * smoothstep(0.70, 0.96, radialT) * 0.13 * strength
    + edgeTint * (innerEdge * 0.48 + outerEdge * 0.90) * strength
    + edgeTint * halo * 0.11 * strength;
}

vec3 outerPanelDetails(vec2 p, float innerRadius, float outerRadius, float angle, float span, vec3 tint, float strength) {
  vec3 color = vec3(0.0);
  float midRadius = (innerRadius + outerRadius) * 0.5;
  float panel = outerBand(p, innerRadius, outerRadius) * outerSector(p, angle, span);
  color += tint * arcMask(p, midRadius, 0.0014, angle, span * 0.84) * 0.32 * strength;
  color += tint * radialDash(p, midRadius, 46.0, 0.065, 0.0012, 0.0) * panel * 0.28 * strength;
  for (int i = 0; i < 4; i++) {
    float offset = (float(i) - 1.5) * span * 0.17;
    vec2 d = vec2(cos(angle + offset), sin(angle + offset));
    color += tint * capsule(p, d * (innerRadius + 0.010), d * (outerRadius - 0.010), 0.0011) * 0.30 * strength;
  }
  color += OUTER_BLUE * outerBand(p, innerRadius + 0.018, innerRadius + 0.024)
    * outerSector(p, angle, span * 0.72) * 0.32 * strength;
  return color;
}

float outerInterruptedTicks(vec2 p, float radius, float phase) {
  float ticks = radialDash(p, radius, 104.0, 0.075, 0.0017, phase);
  float breaks = outerSector(p, 0.34, 0.24)
    + outerSector(p, 1.92, 0.18)
    + outerSector(p, 3.66, 0.30)
    + outerSector(p, 5.44, 0.20);
  return ticks * (1.0 - clamp(breaks, 0.0, 1.0));
}

vec3 outerNode(vec2 p, float radius, float angle, vec3 tint, float pulse) {
  vec2 center = vec2(cos(angle), sin(angle)) * radius;
  float sharp = pointMask(p, center, 0.0075);
  float haloDistance = length(p - center) / 0.030;
  float halo = exp(-(haloDistance * haloDistance));
  return tint * sharp * pulse + tint * halo * 0.18 * pulse;
}

vec3 outerWebModule(vec2 p, float radius, float angle, float size, vec3 tint, float strength) {
  vec2 center = vec2(cos(angle), sin(angle)) * radius;
  vec2 radial = vec2(cos(angle), sin(angle));
  vec2 tangent = vec2(-radial.y, radial.x);
  vec2 a = center + radial * size + tangent * size;
  vec2 b = center + radial * size - tangent * size;
  vec2 c = center - radial * size - tangent * size;
  vec2 d = center - radial * size + tangent * size;
  vec2 local = vec2(dot(p - center, radial), dot(p - center, tangent));
  float body = (1.0 - smoothstep(size, size + 0.012, max(abs(local.x), abs(local.y)))) * 0.16;
  vec3 color = OUTER_DEEP_BLUE * body * strength;
  color += tint * capsule(p, a, b, 0.0012) * 0.50 * strength;
  color += tint * capsule(p, b, c, 0.0012) * 0.50 * strength;
  color += tint * capsule(p, c, d, 0.0012) * 0.50 * strength;
  color += tint * capsule(p, d, a, 0.0012) * 0.50 * strength;
  color += tint * capsule(p, a, c, 0.0009) * 0.34 * strength;
  color += tint * capsule(p, b, d, 0.0009) * 0.34 * strength;
  color += tint * pointMask(p, center, 0.0045) * 0.54 * strength;
  return color;
}

vec3 outerConnectedMesh(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float drift = 0.0;
  for (int i = 0; i < 14; i++) {
    float index = float(i);
    float angleA = 0.18 + index * TAU / 14.0 + drift;
    float angleB = 0.18 + mod(index + 1.0, 14.0) * TAU / 14.0 + drift;
    float innerRadius = 0.302 + mod(index, 3.0) * 0.006;
    float outerRadius = 0.620 + mod(index + 2.0, 3.0) * 0.012;
    vec2 innerA = vec2(cos(angleA), sin(angleA)) * innerRadius;
    vec2 innerB = vec2(cos(angleB), sin(angleB)) * (0.302 + mod(index + 1.0, 3.0) * 0.006);
    vec2 outerA = vec2(cos(angleA + 0.10), sin(angleA + 0.10)) * outerRadius;
    vec2 outerB = vec2(cos(angleB + 0.10), sin(angleB + 0.10)) * (0.620 + mod(index, 2.0) * 0.018);
    float accent = step(0.66, hash11(index * 4.17));
    color += OUTER_BLUE * capsule(p, innerA, innerB, 0.0010) * 0.22;
    color += OUTER_BLUE * capsule(p, outerA, outerB, 0.0010) * 0.18;
    color += OUTER_CYAN_DIM * capsule(p, innerA, outerA, 0.00085) * 0.16;
    color += OUTER_CYAN_DIM * capsule(p, innerB, outerA, 0.00072) * 0.12;
    color += OUTER_ICE * capsule(p, innerA, outerB, 0.00060) * accent * 0.16;
    color += OUTER_CYAN_DIM * pointMask(p, innerA, 0.0026) * (0.12 + accent * 0.10);
    color += OUTER_CYAN_DIM * pointMask(p, outerA, 0.0030) * (0.10 + accent * 0.12);
  }
  return color;
}

vec3 outerCoreMesh(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float drift = 0.0;
  for (int i = 0; i < 8; i++) {
    float index = float(i);
    float angle = 0.38 + index * TAU / 8.0 + drift;
    vec2 d = vec2(cos(angle), sin(angle));
    vec2 n = vec2(-d.y, d.x);
    vec2 nearPoint = d * 0.294;
    vec2 farPoint = d * 0.508 + n * (mod(index, 2.0) * 0.036 - 0.018);
    vec2 crossPoint = vec2(cos(angle + 0.42), sin(angle + 0.42)) * 0.420;
    color += OUTER_BLUE * capsule(p, nearPoint, farPoint, 0.0009) * 0.34;
    color += OUTER_CYAN_DIM * capsule(p, nearPoint, crossPoint, 0.00072) * 0.24;
    color += OUTER_CYAN_DIM * pointMask(p, farPoint, 0.0032) * 0.20;
  }
  return color;
}

vec3 layerOuterRings(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float r2 = dot(p, p);
  if (r2 < 0.076 || r2 > 0.735) return color;
  float clockwise = -t * 0.040;
  float counterClockwise = t * 0.058;
  float panelDriftA = -t * 0.012;
  float panelDriftB = t * 0.010;

  // Levels 01–04: faint recessed construction web near the inner assembly.
  color += OUTER_DEEP_BLUE * outerBand(p, 0.338, 0.770) * 0.48;
  color += OUTER_BLUE * arcMask(p, 0.356, 0.0010, 0.60, 1.38) * 0.28;
  color += OUTER_BLUE * arcMask(p, 0.392, 0.0011, 3.44, 0.92) * 0.24;
  color += OUTER_BLUE * arcMask(p, 0.436, 0.0010, 1.82, 1.26) * 0.22;
  color += OUTER_BLUE * arcMask(p, 0.482, 0.0012, 5.04, 0.82) * 0.24;
  for (int i = 0; i < 8; i++) {
    float a = 0.22 + float(i) * TAU / 8.0;
    vec2 d = vec2(cos(a), sin(a));
    vec2 n = vec2(-d.y, d.x);
    color += OUTER_BLUE * capsule(p, d * 0.350 + n * 0.012, d * 0.520 - n * 0.030, 0.0010) * 0.25;
  }
  for (int i = 0; i < 5; i++) {
    float a = 0.52 + float(i) * TAU / 5.0;
    vec2 d = vec2(cos(a), sin(a));
    vec2 n = vec2(-d.y, d.x);
    color += OUTER_CYAN_DIM * capsule(p, d * 0.418 + n * 0.026, d * 0.492 - n * 0.026, 0.0012) * 0.20;
  }
  // Visible, triangulated construction mesh behind the fragmented rails and glass.
  color += outerConnectedMesh(p, t);
  color += outerCoreMesh(p, t);
  // Small high-energy bridge nodes tie the mesh visually into the inner reactor.
  color += outerNode(p, 0.306, 0.18, OUTER_ICE, 0.84 + 0.16 * sin(t * 1.60));
  color += outerNode(p, 0.312, 2.28, OUTER_CYAN_DIM, 0.76 + 0.20 * sin(t * 1.22 + 1.7));
  color += outerNode(p, 0.308, 4.06, OUTER_WARM, 0.72 + 0.24 * sin(t * 1.48 + 3.4));
  color += outerNode(p, 0.332, 5.46, OUTER_HOT, 0.70 + 0.22 * sin(t * 1.84 + 0.8));

  // Level 05: one interrupted clock-seconds band with a moving bright scanner.
  float clockPhase = -t * 0.074;
  float clockTicks = outerInterruptedTicks(p, 0.452, clockPhase);
  float scanner = outerSector(p, 0.82 + clockPhase * 2.1, 0.40);
  color += OUTER_CYAN_DIM * clockTicks * 0.62;
  color += OUTER_ICE * clockTicks * scanner * 0.78;
  color += OUTER_HOT * radialDash(p, 0.452, 13.0, 0.045, 0.0025, clockPhase) * scanner * 0.46;

  // Levels 06–08: small rails, orange technical inserts and staggered arcs.
  color += outerArc(p, 0.478, 0.0045, 0.12 + clockwise, 0.72, OUTER_CYAN_DIM, 0.72);
  color += outerArc(p, 0.478, 0.0022, 2.76 + clockwise, 0.34, OUTER_ICE, 0.82);
  color += outerArc(p, 0.506, 0.0030, 1.44 + counterClockwise, 0.50, OUTER_AMBER, 0.62);
  color += outerArc(p, 0.506, 0.0038, 4.48 + counterClockwise, 0.86, OUTER_BLUE, 0.52);
  color += OUTER_AMBER * radialDash(p, 0.526, 31.0, 0.082, 0.0018, -t * 0.062) * 0.46;
  color += outerArc(p, 0.542, 0.0055, 3.12 + clockwise, 0.62, HUD_CYAN, 0.72);
  color += outerArc(p, 0.542, 0.0020, 5.74 + clockwise, 0.30, OUTER_WARM, 0.76);

  // Six dominant staggered glass blocks around the inner assembly.
  color += outerPanel(p, 0.315, 0.425, 0.58 + panelDriftA, 0.74, OUTER_CYAN_DIM, OUTER_HOT, 0.98);
  color += outerPanelDetails(p, 0.315, 0.425, 0.58 + panelDriftA, 0.74, OUTER_ICE, 0.78);
  color += outerPanel(p, 0.325, 0.418, 2.16 + panelDriftB, 0.68, OUTER_BLUE, OUTER_WARM, 0.92);
  color += outerPanelDetails(p, 0.325, 0.418, 2.16 + panelDriftB, 0.68, OUTER_AMBER, 0.74);
  color += outerPanel(p, 0.308, 0.432, 3.70 + panelDriftA, 0.80, OUTER_CYAN_DIM, OUTER_HOT, 0.94);
  color += outerPanelDetails(p, 0.308, 0.432, 3.70 + panelDriftA, 0.80, OUTER_ICE, 0.74);
  color += outerPanel(p, 0.322, 0.420, 5.28 + panelDriftB, 0.64, OUTER_BLUE, OUTER_WARM, 0.90);
  color += outerPanelDetails(p, 0.322, 0.420, 5.28 + panelDriftB, 0.64, OUTER_AMBER, 0.72);
  color += outerPanel(p, 0.318, 0.424, 1.28 + panelDriftA, 0.54, OUTER_CYAN_DIM, OUTER_HOT, 0.90);
  color += outerPanelDetails(p, 0.318, 0.424, 1.28 + panelDriftA, 0.54, OUTER_ICE, 0.72);
  color += outerPanel(p, 0.314, 0.428, 4.52 + panelDriftB, 0.58, OUTER_BLUE, OUTER_WARM, 0.88);
  color += outerPanelDetails(p, 0.314, 0.428, 4.52 + panelDriftB, 0.58, OUTER_AMBER, 0.70);
  color += outerPanel(p, 0.438, 0.468, 1.08 + panelDriftB, 0.25, OUTER_BLUE, OUTER_WARM, 0.72);
  color += outerPanel(p, 0.432, 0.462, 2.76 + panelDriftA, 0.22, OUTER_BLUE, OUTER_WARM, 0.68);
  color += outerPanel(p, 0.442, 0.474, 4.38 + panelDriftB, 0.28, OUTER_BLUE, OUTER_WARM, 0.74);
  color += outerPanel(p, 0.435, 0.465, 5.92 + panelDriftA, 0.21, OUTER_BLUE, OUTER_WARM, 0.66);

  // Fine continuous construction guides and bright bridges live between the four blocks.
  float guidePulse = 0.82;
  float guideA = ringMask(p, 0.444, 0.0009);
  float guideB = ringMask(p, 0.486, 0.0008);
  color += OUTER_CYAN_DIM * guideA * 0.58 * guidePulse;
  color += OUTER_ICE * guideB * 0.42;
  color += OUTER_CYAN_DIM * softRing(p, 0.444, 0.0048) * 0.055 * guidePulse;
  color += OUTER_CYAN_DIM * softRing(p, 0.486, 0.0042) * 0.040;
  color += outerArc(p, 0.372, 0.0021, 1.30 + clockwise, 0.26, OUTER_HOT, 0.88);
  color += outerArc(p, 0.386, 0.0018, 2.94 + counterClockwise, 0.22, OUTER_CYAN_DIM, 0.76);
  color += outerArc(p, 0.398, 0.0020, 4.52 + clockwise, 0.24, OUTER_WARM, 0.82);
  color += outerArc(p, 0.410, 0.0017, 6.02 + counterClockwise, 0.20, OUTER_ICE, 0.78);
  color += OUTER_CYAN_DIM * arcGlow(p, 0.372, 0.0050, 1.30 + clockwise, 0.26) * 0.12;
  color += OUTER_WARM * arcGlow(p, 0.398, 0.0050, 4.52 + clockwise, 0.24) * 0.10;

  // A denser mid-housing carries the visual weight, with warm reactor inserts.
  color += outerPanel(p, 0.446, 0.535, 0.18 + panelDriftB, 0.76, OUTER_CYAN_DIM, OUTER_HOT, 0.92);
  color += outerPanelDetails(p, 0.446, 0.535, 0.18 + panelDriftB, 0.76, OUTER_ICE, 0.74);
  color += outerPanel(p, 0.452, 0.548, 1.78 + panelDriftA, 0.68, OUTER_CYAN_DIM, OUTER_HOT, 0.86);
  color += outerPanelDetails(p, 0.452, 0.548, 1.78 + panelDriftA, 0.68, OUTER_ICE, 0.70);
  color += outerPanel(p, 0.442, 0.532, 3.42 + panelDriftB, 0.82, OUTER_CYAN_DIM, OUTER_HOT, 0.90);
  color += outerPanelDetails(p, 0.442, 0.532, 3.42 + panelDriftB, 0.82, OUTER_ICE, 0.72);
  color += outerPanel(p, 0.458, 0.542, 5.04 + panelDriftA, 0.62, OUTER_CYAN_DIM, OUTER_HOT, 0.84);
  color += outerPanelDetails(p, 0.458, 0.542, 5.04 + panelDriftA, 0.62, OUTER_ICE, 0.68);
  color += outerPanel(p, 0.450, 0.540, 1.20 + panelDriftB, 0.56, OUTER_CYAN_DIM, OUTER_HOT, 0.86);
  color += outerPanelDetails(p, 0.450, 0.540, 1.20 + panelDriftB, 0.56, OUTER_ICE, 0.70);
  color += outerPanel(p, 0.446, 0.538, 4.82 + panelDriftA, 0.58, OUTER_CYAN_DIM, OUTER_HOT, 0.88);
  color += outerPanelDetails(p, 0.446, 0.538, 4.82 + panelDriftA, 0.58, OUTER_ICE, 0.72);
  // One additional, offset module per quadrant fills the gaps in this same ring.
  color += outerPanel(p, 0.462, 0.528, 0.94 + panelDriftA, 0.38, OUTER_CYAN_DIM, OUTER_ICE, 0.76);
  color += outerPanelDetails(p, 0.462, 0.528, 0.94 + panelDriftA, 0.38, OUTER_ICE, 0.58);
  color += outerPanel(p, 0.468, 0.534, 2.54 + panelDriftB, 0.34, OUTER_BLUE, OUTER_WARM, 0.70);
  color += outerPanelDetails(p, 0.468, 0.534, 2.54 + panelDriftB, 0.34, OUTER_AMBER, 0.52);
  color += outerPanel(p, 0.460, 0.530, 4.16 + panelDriftA, 0.40, OUTER_CYAN_DIM, OUTER_ICE, 0.74);
  color += outerPanelDetails(p, 0.460, 0.530, 4.16 + panelDriftA, 0.40, OUTER_ICE, 0.56);
  color += outerPanel(p, 0.466, 0.536, 5.78 + panelDriftB, 0.32, OUTER_BLUE, OUTER_WARM, 0.68);
  color += outerPanelDetails(p, 0.466, 0.536, 5.78 + panelDriftB, 0.32, OUTER_AMBER, 0.50);
  color += outerArc(p, 0.474, 0.0080, 0.88 + counterClockwise, 0.30, OUTER_WARM, 0.90);
  color += outerArc(p, 0.506, 0.0070, 2.60 + clockwise, 0.26, OUTER_AMBER, 0.86);
  color += outerArc(p, 0.522, 0.0065, 4.18 + counterClockwise, 0.34, OUTER_WARM, 0.82);
  color += OUTER_AMBER * arcGlow(p, 0.506, 0.0140, 2.60 + clockwise, 0.26) * 0.16;
  color += OUTER_AMBER * arcGlow(p, 0.522, 0.0130, 4.18 + counterClockwise, 0.34) * 0.14;
  color += outerTransitionRail(p, 0.548, 0.44 + counterClockwise, 0.38, vec3(0.25, 0.08, 0.01), OUTER_AMBER, OUTER_WARM, 0.96);
  color += outerTransitionRail(p, 0.558, 3.42 + clockwise, 0.30, vec3(0.25, 0.08, 0.01), OUTER_AMBER, OUTER_HOT, 0.92);
  color += outerNode(p, 0.506, 2.62 + clockwise, OUTER_WARM, 0.90 + 0.10 * sin(t * 1.7));
  color += outerNode(p, 0.548, 0.44 + counterClockwise, OUTER_AMBER, 0.82 + 0.18 * sin(t * 1.3 + 1.4));

  // Levels 09–11: quadrant construction. Cyan glass at TR/BL, dark amber rails at TL/BR.
  float cyanPulse = 0.90;
  float warmPulse = 0.88;
  color += outerPanel(p, 0.562, 0.646, 0.72 + panelDriftA, 0.98, OUTER_CYAN_DIM, OUTER_ICE, cyanPulse);
  color += outerPanelDetails(p, 0.562, 0.646, 0.72 + panelDriftA, 0.98, OUTER_ICE, cyanPulse);
  color += outerPanel(p, 0.562, 0.646, 3.86 + panelDriftA, 1.14, OUTER_CYAN_DIM, HUD_CYAN_BRIGHT, cyanPulse * 0.88);
  color += outerPanelDetails(p, 0.562, 0.646, 3.86 + panelDriftA, 1.14, OUTER_ICE, cyanPulse * 0.82);
  color += outerPanel(p, 0.575, 0.624, 2.26 + panelDriftB, 0.70, OUTER_BLUE, OUTER_BLUE, warmPulse * 0.64);
  color += outerPanelDetails(p, 0.575, 0.624, 2.26 + panelDriftB, 0.70, OUTER_AMBER, warmPulse * 0.56);
  color += outerPanel(p, 0.575, 0.624, 5.40 + panelDriftB, 0.62, OUTER_BLUE, OUTER_BLUE, warmPulse * 0.62);
  color += outerPanelDetails(p, 0.575, 0.624, 5.40 + panelDriftB, 0.62, OUTER_AMBER, warmPulse * 0.56);
  color += outerArc(p, 0.654, 0.0040, 2.26 + panelDriftB, 0.70, OUTER_AMBER, 0.76);
  color += outerArc(p, 0.654, 0.0030, 5.40 + panelDriftB, 0.62, OUTER_WARM, 0.70);

  // Levels 12–14: large disconnected housing rails and a connected long panel.
  color += outerPanel(p, 0.636, 0.708, 1.98 + panelDriftB, 0.86, OUTER_BLUE, OUTER_CYAN_DIM, 0.30);
  color += outerPanelDetails(p, 0.636, 0.708, 1.98 + panelDriftB, 0.86, OUTER_CYAN_DIM, 0.32);
  color += outerPanel(p, 0.654, 0.730, 4.70 + panelDriftA, 0.48, OUTER_CYAN_DIM, OUTER_ICE, 0.38);
  color += outerPanelDetails(p, 0.654, 0.730, 4.70 + panelDriftA, 0.48, OUTER_ICE, 0.34);
  color += outerArc(p, 0.670, 0.0100, 0.30 + counterClockwise, 0.46, HUD_CYAN_BRIGHT, 0.36);
  color += outerArc(p, 0.670, 0.0070, 2.72 + counterClockwise, 0.25, HUD_CYAN, 0.28);
  color += outerArc(p, 0.670, 0.0090, 3.88 + counterClockwise, 0.58, OUTER_ICE, 0.34);
  color += outerArc(p, 0.670, 0.0050, 5.88 + counterClockwise, 0.18, OUTER_AMBER, 0.26);

  // Levels 15–16: sparse construction rails approaching, but not forming, the final boundary.
  color += outerArc(p, 0.772, 0.0020, 0.84 + clockwise, 0.30, OUTER_BLUE, 0.22);
  color += outerArc(p, 0.804, 0.0030, 2.86 + clockwise, 0.18, OUTER_CYAN_DIM, 0.26);
  color += outerArc(p, 0.804, 0.0018, 5.18 + clockwise, 0.10, OUTER_WARM, 0.22);

  // Localized traveling sweeps and deliberately uneven node clusters.
  color += outerArc(p, 0.622, 0.0040, 0.28 - t * 0.156, 0.18, OUTER_WARM, 0.98);
  color += outerArc(p, 0.698, 0.0050, 4.46 + t * 0.120, 0.26, OUTER_HOT, 0.90);
  color += outerArc(p, 0.738, 0.0035, 2.34 - t * 0.092, 0.22, HUD_CYAN_BRIGHT, 0.74);
  float pulseA = 0.82;
  float pulseB = 0.80;
  color += outerNode(p, 0.506, 2.10, OUTER_WARM, pulseA);
  color += outerNode(p, 0.616, 0.10 + counterClockwise, HUD_CYAN_BRIGHT, pulseB);
  color += outerNode(p, 0.628, 0.22 + counterClockwise, OUTER_CYAN_DIM, pulseA * 0.62);
  color += outerNode(p, 0.706, 3.52 + clockwise, OUTER_AMBER, pulseB * 0.78);
  color += outerNode(p, 0.720, 3.66 + clockwise, OUTER_HOT, pulseA * 0.56);

  // Levels 17–19: denser intermediate rails, paired filaments and warm inserts.
  color += outerArc(p, 0.566, 0.0018, 0.96 + clockwise, 0.34, OUTER_ICE, 0.58);
  color += outerArc(p, 0.579, 0.0022, 3.76 + counterClockwise, 0.46, OUTER_CYAN_DIM, 0.52);
  color += outerArc(p, 0.592, 0.0020, 5.64 + clockwise, 0.30, OUTER_WARM, 0.70);
  color += OUTER_CYAN_DIM * radialDash(p, 0.606, 52.0, 0.052, 0.0013, counterClockwise) * 0.36;
  color += OUTER_AMBER * radialDash(p, 0.618, 23.0, 0.070, 0.0017, clockwise) * 0.40;

  // Levels 20–21: large and small bright-edged filament panels, deliberately offset.
  color += outerPanel(p, 0.626, 0.716, 5.70 + panelDriftA, 1.34, OUTER_CYAN_DIM, OUTER_HOT, 0.84);
  color += outerPanelDetails(p, 0.626, 0.716, 5.70 + panelDriftA, 1.34, OUTER_ICE, 0.88);
  color += outerPanel(p, 0.642, 0.690, 2.98 + panelDriftB, 0.44, OUTER_BLUE, OUTER_WARM, 0.66);
  color += outerPanelDetails(p, 0.642, 0.690, 2.98 + panelDriftB, 0.44, OUTER_AMBER, 0.64);

  // Levels 22–24: thin construction stars and cross-level polygon links.
  for (int i = 0; i < 7; i++) {
    float a = 0.34 + float(i) * TAU / 7.0 + clockwise * 0.18;
    vec2 d = vec2(cos(a), sin(a));
    vec2 n = vec2(-d.y, d.x);
    color += OUTER_BLUE * capsule(p, d * 0.714 + n * 0.018, d * 0.782 - n * 0.026, 0.00085) * 0.42;
    color += OUTER_CYAN_DIM * capsule(p, d * 0.742 - n * 0.024, d * 0.806 + n * 0.016, 0.00075) * 0.34;
    color += OUTER_CYAN_DIM * pointMask(p, d * 0.762, 0.0032) * 0.42;
  }
  color += outerArc(p, 0.732, 0.0013, 1.14, 0.62, OUTER_BLUE, 0.42);
  color += outerArc(p, 0.754, 0.0014, 3.98, 0.74, OUTER_CYAN_DIM, 0.38);
  color += outerArc(p, 0.726, 0.0012, 5.50, 0.46, OUTER_BLUE, 0.36);

  // Levels 25–26: four sparse web squares outside the curved machinery.
  color += outerWebModule(p, 0.712, 0.54 + panelDriftB, 0.030, OUTER_CYAN_DIM, 0.64);
  color += outerWebModule(p, 0.694, 2.16 + panelDriftA, 0.024, OUTER_AMBER, 0.50);
  color += outerWebModule(p, 0.728, 3.72 + panelDriftB, 0.034, OUTER_ICE, 0.66);
  color += outerWebModule(p, 0.704, 5.42 + panelDriftA, 0.022, OUTER_BLUE, 0.46);

  // Level 27: 60-second full tick circle; only the scanner is bright and moving.
  float secondsPhase = -t * TAU / 60.0;
  float secondsTicks = radialDash(p, 0.744, 60.0, 0.038, 0.0013, secondsPhase);
  float secondsScanner = outerSector(p, 0.24 + secondsPhase, 0.30);
  color += OUTER_BLUE * secondsTicks * 0.42;
  color += OUTER_ICE * secondsTicks * secondsScanner * 0.82;
  color += OUTER_ICE * radialDash(p, 0.744, 12.0, 0.072, 0.0019, secondsPhase) * 0.52;
  color += OUTER_HOT * radialDash(p, 0.744, 12.0, 0.072, 0.0023, secondsPhase) * secondsScanner * 0.62;

  // Larger and smaller sparse particles break up the dark field without a grid.
  color += outerNode(p, 0.686, 0.72 + counterClockwise, OUTER_HOT, pulseB * 0.90);
  color += outerNode(p, 0.714, 1.44 + clockwise, OUTER_CYAN_DIM, pulseA * 0.62);
  color += outerNode(p, 0.742, 2.66 + counterClockwise, OUTER_AMBER, pulseB * 0.74);
  color += outerNode(p, 0.698, 4.38 + clockwise, OUTER_ICE, pulseA * 0.58);
  color += outerNode(p, 0.752, 5.82 + counterClockwise, OUTER_CYAN_DIM, pulseB * 0.60);
  return color;
}
