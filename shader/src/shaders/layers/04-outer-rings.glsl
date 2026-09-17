// Penultimate mechanical housing: intentionally irregular large-scale structure.
const vec3 OUTER_ICE = vec3(0.54, 0.96, 1.00);
const vec3 OUTER_BLUE = vec3(0.00, 0.42, 0.57);
const vec3 OUTER_DEEP = vec3(0.00, 0.10, 0.16);
const vec3 OUTER_AMBER = vec3(1.00, 0.62, 0.25);
const vec3 OUTER_WARM_WHITE = vec3(1.00, 0.90, 0.73);

float outerBandMask(vec2 p, float innerRadius, float outerRadius) {
  float r = length(p);
  return smoothstep(innerRadius, innerRadius + 0.006, r)
    * (1.0 - smoothstep(outerRadius - 0.006, outerRadius, r));
}

float outerSegmentMask(vec2 p, float angle, float span) {
  float a = atan(p.y, p.x);
  float delta = abs(atan(sin(a - angle), cos(a - angle)));
  return 1.0 - smoothstep(span * 0.5, span * 0.5 + 0.018, delta);
}

vec3 outerArcEnergy(vec2 p, float radius, float width, float angle, float span, vec3 source, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float halo = arcGlow(p, radius, width, angle, span);
  return source * sharp * strength + source * halo * 0.13 * uGlowIntensity;
}

vec3 outerGlassPanel(vec2 p, float innerRadius, float outerRadius, float angle, float span, float strength) {
  float panel = outerBandMask(p, innerRadius, outerRadius) * outerSegmentMask(p, angle, span);
  float r = length(p);
  float innerEdge = arcMask(p, innerRadius, 0.0034, angle, span);
  float outerEdge = arcMask(p, outerRadius, 0.0044, angle, span);
  float glow = arcGlow(p, outerRadius, 0.0060, angle, span);
  float centerLight = exp(-pow((r - (innerRadius + outerRadius) * 0.5) / 0.040, 2.0));
  return OUTER_DEEP * panel * 0.72
    + OUTER_BLUE * panel * centerLight * 0.30 * strength
    + OUTER_ICE * (innerEdge * 0.50 + outerEdge * 0.90) * strength
    + HUD_CYAN_BRIGHT * glow * 0.11 * strength;
}

vec3 outerNode(vec2 p, float radius, float angle, vec3 tint, float pulse) {
  vec2 center = vec2(cos(angle), sin(angle)) * radius;
  float point = pointMask(p, center, 0.008);
  float halo = exp(-pow(length(p - center) / 0.032, 2.0));
  return tint * point * pulse + tint * halo * 0.18 * pulse;
}

vec3 layerOuterRings(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float slowClockwise = -t * 0.030;
  float slowCounter = t * 0.047;

  // Recessed spider-web, deliberately behind the brighter machinery.
  color += OUTER_DEEP * outerBandMask(p, 0.350, 0.735) * 0.42;
  color += OUTER_BLUE * ringMask(p, 0.372, 0.0010) * 0.28;
  color += OUTER_BLUE * ringMask(p, 0.448, 0.0012) * 0.24;
  color += OUTER_BLUE * ringMask(p, 0.538, 0.0010) * 0.20;
  color += OUTER_BLUE * ringMask(p, 0.665, 0.0012) * 0.22;
  for (int i = 0; i < 9; i++) {
    float a = 0.18 + float(i) * TAU / 9.0;
    vec2 d = vec2(cos(a), sin(a));
    vec2 n = vec2(-d.y, d.x);
    color += OUTER_BLUE * capsule(p, d * 0.372 + n * 0.008, d * 0.665 - n * 0.020, 0.0010) * 0.24;
  }

  // Dense tick circle: the only complete repeating band in this layer.
  color += OUTER_BLUE * tickRing(p, 0.405, 96.0, 0.0045, 0.014) * 0.60;
  color += HUD_CYAN_BRIGHT * radialDash(p, 0.405, 24.0, 0.10, 0.0021, slowCounter) * 0.50;

  // Uneven interrupted arcs and three translucent glass panels.
  color += outerArcEnergy(p, 0.468, 0.0060, 0.14 + slowClockwise, 1.12, HUD_CYAN, 0.78);
  color += outerArcEnergy(p, 0.468, 0.0030, 3.18 + slowClockwise, 0.58, OUTER_ICE, 0.86);
  color += outerArcEnergy(p, 0.498, 0.0040, 2.02 + slowCounter, 0.94, OUTER_BLUE, 0.62);
  color += outerArcEnergy(p, 0.526, 0.0035, 4.91 + slowCounter, 0.43, OUTER_AMBER, 0.72);
  color += outerGlassPanel(p, 0.548, 0.604, 0.58 + slowClockwise, 0.78, 0.92);
  color += outerGlassPanel(p, 0.548, 0.604, 2.74 + slowClockwise, 1.18, 0.74);
  color += outerGlassPanel(p, 0.548, 0.604, 5.05 + slowClockwise, 0.48, 0.64);

  // Large interrupted rails remain legible at dashboard scale.
  color += outerArcEnergy(p, 0.632, 0.0110, 0.22 + slowCounter, 0.92, HUD_CYAN_BRIGHT, 0.82);
  color += outerArcEnergy(p, 0.632, 0.0080, 2.21 + slowCounter, 0.55, HUD_CYAN, 0.68);
  color += outerArcEnergy(p, 0.632, 0.0100, 3.78 + slowCounter, 1.02, OUTER_ICE, 0.88);
  color += outerArcEnergy(p, 0.632, 0.0060, 5.68 + slowCounter, 0.34, OUTER_AMBER, 0.60);
  color += outerArcEnergy(p, 0.680, 0.0040, 1.37 + slowClockwise, 1.36, OUTER_BLUE, 0.56);
  color += outerArcEnergy(p, 0.702, 0.0090, 3.72 + slowClockwise, 0.74, HUD_CYAN, 0.74);
  color += outerArcEnergy(p, 0.702, 0.0055, 5.72 + slowClockwise, 0.46, OUTER_ICE, 0.82);

  // Moving highlights and sparse asymmetric node clusters.
  color += outerArcEnergy(p, 0.632, 0.0040, 1.10 - t * 0.115, 0.20, OUTER_WARM_WHITE, 0.96);
  color += outerArcEnergy(p, 0.702, 0.0045, 4.42 + t * 0.086, 0.28, HUD_CYAN_BRIGHT, 0.92);
  color += OUTER_AMBER * radialDash(p, 0.579, 28.0, 0.10, 0.0020, -t * 0.070) * 0.36;
  float nodePulseA = 0.78 + 0.18 * sin(t * 0.92);
  float nodePulseB = 0.76 + 0.20 * sin(t * 0.71 + 2.3);
  color += outerNode(p, 0.469, 2.82, OUTER_ICE, nodePulseA);
  color += outerNode(p, 0.633, 0.06 + slowCounter, HUD_CYAN_BRIGHT, nodePulseB);
  color += outerNode(p, 0.635, 0.16 + slowCounter, HUD_CYAN, nodePulseA * 0.62);
  color += outerNode(p, 0.704, 3.54 + slowClockwise, OUTER_AMBER, nodePulseB * 0.80);
  color += outerNode(p, 0.704, 3.66 + slowClockwise, OUTER_WARM_WHITE, nodePulseA * 0.64);

  // Faint termination guide; the final outermost layer remains unimplemented.
  color += OUTER_DEEP * ringMask(p, 0.748, 0.0014) * 0.44;
  color += HUD_CYAN * arcMask(p, 0.748, 0.0022, 5.24, 0.32) * 0.30;
  return color;
}
