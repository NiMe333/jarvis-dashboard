// -----------------------------------------------------------------------------
// JARVIS HUD — Layer 06: immediate reactor housing around the locked core.
// The core silhouette is radius 0.47 in this shared local core space.
// -----------------------------------------------------------------------------
const float INNER_CORE_SCALE = 0.21;
const float INNER_CORE_RADIUS = 0.47;
const float INNER_RING_SPEED_SLOW = 0.025;
const float INNER_RING_SPEED_MEDIUM = 0.055;
const float INNER_RING_GLOW = 1.0;

const vec3 RING_ORANGE_WHITE = vec3(1.00, 0.92, 0.74);
const vec3 RING_ORANGE_LIGHT = vec3(1.00, 0.65, 0.27);
const vec3 RING_ORANGE = vec3(1.00, 0.37, 0.07);
const vec3 RING_ORANGE_DARK = vec3(0.45, 0.12, 0.015);

const vec3 RING_BLUE_DEEP = vec3(0.005, 0.08, 0.13);
const vec3 RING_BLUE_DARK = vec3(0.00, 0.22, 0.32);
const vec3 RING_CYAN_DIM = vec3(0.00, 0.48, 0.60);
const vec3 RING_CYAN = vec3(0.00, 0.82, 0.94);
const vec3 RING_CYAN_BRIGHT = vec3(0.34, 0.96, 1.00);
const vec3 RING_CYAN_WHITE = vec3(0.82, 0.99, 1.00);

float annularBand(vec2 p, float innerRadius, float outerRadius) {
  float radius = length(p);
  return smoothstep(innerRadius, innerRadius + 0.012, radius)
    * (1.0 - smoothstep(outerRadius - 0.012, outerRadius, radius));
}

float sectorFill(vec2 p, float innerRadius, float outerRadius, float count, float phase) {
  float angle = atan(p.y, p.x);
  float sector = floor((angle + PI + phase) / TAU * count);
  float local = fract((angle + PI + phase) / TAU * count);
  float sideGap = smoothstep(0.018, 0.055, min(local, 1.0 - local));
  float variation = 0.46 + 0.54 * hash11(sector * 3.17 + count);
  return annularBand(p, innerRadius, outerRadius) * sideGap * variation;
}

float sectorRays(vec2 p, float innerRadius, float outerRadius, float count, float phase) {
  float angle = atan(p.y, p.x);
  float radial = annularBand(p, innerRadius, outerRadius);
  float ray = 1.0 - smoothstep(0.010, 0.025, abs(sin((angle + phase) * count * 0.5)));
  return radial * ray;
}

vec3 structuralRing(vec2 p, float radius, float width, vec3 source, vec3 halo, float strength) {
  float sharp = ringMask(p, radius, width);
  float nearHalo = exp(-pow(abs(length(p) - radius) / max(width * 4.0, 0.012), 2.0));
  return source * sharp * strength + halo * nearHalo * 0.070 * INNER_RING_GLOW;
}

vec3 hotContainmentRing(vec2 p, float radius) {
  float sharp = ringMask(p, radius, 0.014);
  float innerHalo = exp(-pow(abs(length(p) - radius) / 0.032, 2.0));
  float outerBloom = exp(-pow(abs(length(p) - radius) / 0.088, 2.0));
  return RING_ORANGE_WHITE * sharp * 1.08
    + RING_ORANGE_LIGHT * innerHalo * 0.31 * INNER_RING_GLOW
    + RING_ORANGE_DARK * outerBloom * 0.19 * INNER_RING_GLOW;
}

vec3 orangeArc(vec2 p, float radius, float width, float angle, float span, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float halo = arcGlow(p, radius, width, angle, span);
  return RING_ORANGE_LIGHT * sharp * strength + RING_ORANGE * halo * 0.20 * INNER_RING_GLOW;
}

vec3 innerArc(vec2 p, float radius, float width, float angle, float span, vec3 tint, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float halo = arcGlow(p, radius, width, angle, span);
  return tint * sharp * strength + RING_CYAN_BRIGHT * halo * 0.12 * INNER_RING_GLOW;
}

float tickMask(vec2 p, float radius, float count, float phase, float majorOnly) {
  float r = length(p);
  float angle = atan(p.y, p.x);
  float slot = floor((angle + PI + phase) / TAU * count);
  float local = fract((angle + PI + phase) / TAU * count);
  float major = 1.0 - step(0.5, mod(slot, 8.0));
  float tickActive = mix(1.0, major, majorOnly);
  float mark = 1.0 - smoothstep(0.09, 0.21, abs(local - 0.5));
  float lengthMark = mix(0.014, 0.030, major);
  float radial = lineMask(abs(r - (radius + lengthMark * 0.5)), mix(0.0032, 0.0060, major));
  return tickActive * mark * radial;
}

vec3 ringHighlight(vec2 p, float radius, float angle, float pulse) {
  vec2 direction = vec2(cos(angle), sin(angle));
  vec2 point = direction * radius;
  float sharp = pointMask(p, point, 0.012);
  float halo = exp(-pow(length(p - point) / 0.040, 2.0));
  float flare = capsule(p, point - direction * 0.030, point + direction * 0.042, 0.0022);
  return RING_CYAN_WHITE * sharp * pulse
    + RING_CYAN_BRIGHT * halo * 0.18 * pulse
    + RING_CYAN_WHITE * flare * 0.35 * pulse;
}

vec3 layerInnerRings(vec2 p, float t) {
  vec2 q = p / INNER_CORE_SCALE;
  vec3 color = vec3(0.0);
  float radius = length(q);

  // 1. Recessed blue mechanical well and three overlapping annular panel bands.
  float housingWell = annularBand(q, 0.54, 1.00);
  color += RING_BLUE_DEEP * housingWell * 0.34;
  color += RING_BLUE_DARK * sectorFill(q, 0.54, 0.70, 16.0, 0.00) * 0.33;
  color += RING_BLUE_DARK * sectorFill(q, 0.69, 0.84, 18.0, 0.11) * 0.28;
  color += RING_BLUE_DEEP * sectorFill(q, 0.83, 1.00, 14.0, -0.07) * 0.48;
  color += RING_CYAN_DIM * sectorRays(q, 0.54, 0.70, 16.0, 0.00) * 0.15;
  color += RING_BLUE_DARK * sectorRays(q, 0.69, 0.84, 18.0, 0.11) * 0.55;
  color += RING_CYAN_DIM * sectorRays(q, 0.83, 1.00, 14.0, -0.07) * 0.14;

  // Fixed diagonal panel braces: local, sparse and intentionally non-Cartesian.
  for (int i = 0; i < 8; i++) {
    float angle = 0.17 + float(i) * TAU / 8.0;
    vec2 direction = vec2(cos(angle), sin(angle));
    vec2 tangent = vec2(-direction.y, direction.x);
    color += RING_BLUE_DARK * capsule(q, direction * 0.58 + tangent * 0.025, direction * 0.76 - tangent * 0.045, 0.0026) * 0.62;
    color += RING_CYAN_DIM * capsule(q, direction * 0.80 - tangent * 0.020, direction * 0.95 + tangent * 0.040, 0.0016) * 0.34;
  }

  // 2. Dense stationary structural circles establish the depth stack.
  color += structuralRing(q, 0.525, 0.0035, RING_BLUE_DARK, RING_CYAN_DIM, 0.66);
  color += structuralRing(q, 0.548, 0.0025, RING_CYAN_DIM, RING_BLUE_DARK, 0.44);
  color += structuralRing(q, 0.610, 0.0030, RING_BLUE_DARK, RING_CYAN_DIM, 0.60);
  color += structuralRing(q, 0.642, 0.0040, RING_CYAN_DIM, RING_BLUE_DARK, 0.54);
  color += structuralRing(q, 0.700, 0.0025, RING_BLUE_DARK, RING_CYAN_DIM, 0.62);
  color += structuralRing(q, 0.748, 0.0032, RING_CYAN_DIM, RING_BLUE_DARK, 0.46);
  color += structuralRing(q, 0.790, 0.0024, RING_BLUE_DARK, RING_CYAN_DIM, 0.62);
  color += structuralRing(q, 0.818, 0.0040, RING_CYAN_DIM, RING_BLUE_DARK, 0.50);
  color += structuralRing(q, 0.874, 0.0028, RING_BLUE_DARK, RING_CYAN_DIM, 0.64);
  color += structuralRing(q, 0.928, 0.0035, RING_CYAN_DIM, RING_BLUE_DARK, 0.50);
  color += structuralRing(q, 0.972, 0.0024, RING_BLUE_DARK, RING_CYAN_DIM, 0.66);

  // 3. Dominant containment ring with an intentional dark gap from the core.
  color += hotContainmentRing(q, 0.575);
  color += structuralRing(q, 0.552, 0.0020, RING_ORANGE_DARK, RING_ORANGE, 0.48);
  color += structuralRing(q, 0.603, 0.0022, RING_ORANGE_LIGHT, RING_ORANGE, 0.42);

  // Thin orange technical circles and clockwise moving energy traces.
  float orangeRotation = -t * INNER_RING_SPEED_SLOW * 0.72;
  color += RING_ORANGE_DARK * ringMask(q, 0.664, 0.0022) * 0.62;
  color += RING_ORANGE_LIGHT * ringMask(q, 0.734, 0.0018) * 0.35;
  color += RING_ORANGE_DARK * radialDash(q, 0.856, 44.0, 0.24, 0.0018, orangeRotation) * 0.52;
  color += orangeArc(q, 0.636, 0.0045, 0.28 + orangeRotation, 0.20, 0.72);
  color += orangeArc(q, 0.715, 0.0038, 2.06 + orangeRotation, 0.26, 0.60);
  color += orangeArc(q, 0.764, 0.0042, 3.64 + orangeRotation, 0.18, 0.68);
  color += orangeArc(q, 0.846, 0.0034, 4.92 + orangeRotation, 0.24, 0.52);
  color += orangeArc(q, 0.944, 0.0030, 5.76 + orangeRotation, 0.15, 0.46);

  // 4. Cyan energy bands, independently rotating segment arcs and micro ticks.
  color += structuralRing(q, 0.625, 0.0080, RING_CYAN, RING_CYAN_BRIGHT, 0.78);
  color += RING_CYAN_BRIGHT * softRing(q, 0.625, 0.018) * 0.075 * INNER_RING_GLOW;
  float cyanRotation = t * INNER_RING_SPEED_MEDIUM;
  color += innerArc(q, 0.682, 0.0055, 0.20 + cyanRotation, 0.27, RING_CYAN_BRIGHT, 0.80);
  color += innerArc(q, 0.682, 0.0040, 1.38 + cyanRotation, 0.18, RING_CYAN, 0.60);
  color += innerArc(q, 0.682, 0.0060, 2.54 + cyanRotation, 0.32, RING_CYAN_BRIGHT, 0.78);
  color += innerArc(q, 0.682, 0.0040, 3.78 + cyanRotation, 0.20, RING_CYAN_DIM, 0.56);
  color += innerArc(q, 0.682, 0.0055, 4.84 + cyanRotation, 0.28, RING_CYAN_BRIGHT, 0.76);
  color += innerArc(q, 0.682, 0.0040, 5.88 + cyanRotation, 0.16, RING_CYAN, 0.56);
  float tickRotation = -t * INNER_RING_SPEED_MEDIUM * 0.72;
  color += RING_CYAN_DIM * tickMask(q, 0.772, 56.0, tickRotation, 0.0) * 0.78;
  color += RING_CYAN_BRIGHT * tickMask(q, 0.772, 56.0, tickRotation, 1.0) * 0.58;

  // Cyan connector accents between nearby rings; they read as local machinery.
  for (int i = 0; i < 6; i++) {
    float angle = 0.42 + float(i) * TAU / 6.0;
    vec2 direction = vec2(cos(angle), sin(angle));
    color += RING_CYAN_DIM * capsule(q, direction * 0.812, direction * 0.866, 0.0022) * 0.62;
  }

  // 5. Outer closure with cyan arcs, then small controlled energy highlights.
  color += structuralRing(q, 0.952, 0.0050, RING_CYAN_DIM, RING_CYAN, 0.72);
  float outerRotation = t * INNER_RING_SPEED_SLOW * 0.68;
  color += innerArc(q, 0.952, 0.0060, 0.26 + outerRotation, 0.30, RING_CYAN_BRIGHT, 0.76);
  color += innerArc(q, 0.952, 0.0040, 1.42 + outerRotation, 0.22, RING_CYAN, 0.58);
  color += innerArc(q, 0.952, 0.0060, 2.56 + outerRotation, 0.34, RING_CYAN_BRIGHT, 0.78);
  color += innerArc(q, 0.952, 0.0040, 3.68 + outerRotation, 0.20, RING_CYAN, 0.54);
  color += innerArc(q, 0.952, 0.0055, 4.74 + outerRotation, 0.28, RING_CYAN_BRIGHT, 0.72);
  color += innerArc(q, 0.952, 0.0040, 5.78 + outerRotation, 0.18, RING_CYAN, 0.54);

  float highlightPulse = 0.94 + 0.06 * sin(t * 1.35);
  color += ringHighlight(q, 0.625, 0.06, highlightPulse);
  color += ringHighlight(q, 0.682, 2.56 + cyanRotation, highlightPulse);
  color += ringHighlight(q, 0.772, 4.18, highlightPulse * 0.86);
  color += ringHighlight(q, 0.952, 5.72 + outerRotation, highlightPulse * 0.90);
  return color;
}
