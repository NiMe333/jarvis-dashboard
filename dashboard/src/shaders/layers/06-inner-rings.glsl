// Immediate reactor housing: 16+ distinct layers from 1.06 R to 2.75 R.
const float INNER_CORE_SCALE = 0.21;
const float INNER_CORE_RADIUS = 0.47;
const float INNER_RING_SPEED_SLOW = 0.035;
const float INNER_RING_SPEED_MEDIUM = 0.077;
const float INNER_RING_GLOW = 1.0;

const vec3 RING_ORANGE_WHITE = vec3(1.00, 0.92, 0.74);
const vec3 RING_ORANGE_LIGHT = vec3(1.00, 0.65, 0.27);
const vec3 RING_ORANGE = vec3(1.00, 0.37, 0.07);
const vec3 RING_ORANGE_DARK = vec3(0.45, 0.12, 0.015);
const vec3 RING_AMBER = vec3(1.00, 0.54, 0.14);       // #FF8A24
const vec3 RING_AMBER_HIGHLIGHT = vec3(1.00, 0.71, 0.35); // #FFB45A
const vec3 RING_BLUE_DEEP = vec3(0.005, 0.08, 0.13);
const vec3 RING_BLUE_DARK = vec3(0.00, 0.22, 0.32);
const vec3 RING_CYAN_DIM = vec3(0.00, 0.48, 0.60);
const vec3 RING_CYAN = vec3(0.00, 0.82, 0.94);
const vec3 RING_CYAN_BRIGHT = vec3(0.34, 0.96, 1.00);
const vec3 RING_CYAN_WHITE = vec3(0.82, 0.99, 1.00);
const vec3 TRANSITION_AMBER = vec3(1.00, 0.58, 0.20);
const vec3 TRANSITION_WARM = vec3(1.00, 0.88, 0.68);
const vec3 TRANSITION_WHITE = vec3(0.94, 0.99, 0.97);
const vec3 TRANSITION_ICE = vec3(0.52, 0.98, 1.00);
const vec3 TRANSITION_CYAN = vec3(0.00, 0.82, 0.94);

float innerBand(vec2 p, float innerRadius, float outerRadius) {
  float r = length(p);
  return smoothstep(innerRadius, innerRadius + 0.010, r)
    * (1.0 - smoothstep(outerRadius - 0.010, outerRadius, r));
}

float innerSectorFill(vec2 p, float innerRadius, float outerRadius, float count, float phase) {
  float a = atan(p.y, p.x);
  float sector = floor((a + PI + phase) / TAU * count);
  float local = fract((a + PI + phase) / TAU * count);
  float gap = smoothstep(0.018, 0.052, min(local, 1.0 - local));
  float tone = 0.42 + 0.58 * hash11(sector * 2.71 + count);
  return innerBand(p, innerRadius, outerRadius) * gap * tone;
}

float innerSectorEdges(vec2 p, float innerRadius, float outerRadius, float count, float phase) {
  float a = atan(p.y, p.x);
  float ray = 1.0 - smoothstep(0.010, 0.024, abs(sin((a + phase) * count * 0.5)));
  return innerBand(p, innerRadius, outerRadius) * ray;
}

vec3 energyRing(vec2 p, float radius, float width, vec3 source, vec3 halo, float strength) {
  float sharp = ringMask(p, radius, width);
  float nearHalo = exp(-pow(abs(length(p) - radius) / max(width * 5.5, 0.016), 2.0));
  return source * sharp * strength
    + halo * nearHalo * 0.105 * INNER_RING_GLOW;
}

vec3 transitionRing(vec2 p, float radius) {
  float signedDistance = length(p) - radius;
  float body = smoothstep(-0.015, -0.007, signedDistance)
    * (1.0 - smoothstep(0.007, 0.015, signedDistance));
  float ramp = clamp(signedDistance / 0.030 + 0.5, 0.0, 1.0);
  vec3 inward = mix(TRANSITION_AMBER, TRANSITION_WARM, smoothstep(0.00, 0.44, ramp));
  vec3 outward = mix(TRANSITION_WHITE, TRANSITION_ICE, smoothstep(0.52, 1.00, ramp));
  vec3 tint = mix(inward, outward, smoothstep(0.38, 0.68, ramp));
  float brightCenter = exp(-pow(signedDistance / 0.006, 2.0));
  float halo = exp(-pow(signedDistance / 0.040, 2.0));
  return tint * body * 0.82 + TRANSITION_WHITE * brightCenter * 0.34 + TRANSITION_CYAN * halo * 0.055;
}

vec3 orangeContainment(vec2 p, float radius) {
  float sharp = ringMask(p, radius, 0.018);
  float middle = exp(-pow(abs(length(p) - radius) / 0.031, 2.0));
  return RING_AMBER_HIGHLIGHT * sharp * 1.04
    + RING_AMBER * middle * 0.58 * INNER_RING_GLOW;
}

vec3 cyanArc(vec2 p, float radius, float width, float angle, float span, vec3 tint, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float halo = arcGlow(p, radius, width, angle, span);
  return tint * sharp * strength + RING_CYAN_BRIGHT * halo * 0.12 * INNER_RING_GLOW;
}

vec3 orangeArc(vec2 p, float radius, float width, float angle, float span, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float halo = arcGlow(p, radius, width, angle, span);
  return RING_ORANGE_LIGHT * sharp * strength + RING_ORANGE * halo * 0.205 * INNER_RING_GLOW;
}

float reactorTicks(vec2 p, float radius, float count, float phase, float majorOnly) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float slot = floor((a + PI + phase) / TAU * count);
  float local = fract((a + PI + phase) / TAU * count);
  float major = 1.0 - step(0.5, mod(slot, 8.0));
  float tickEnabled = mix(1.0, major, majorOnly);
  float mark = 1.0 - smoothstep(0.09, 0.21, abs(local - 0.5));
  float tickLength = mix(0.013, 0.029, major);
  float radial = lineMask(abs(r - (radius + tickLength * 0.5)), mix(0.0030, 0.0055, major));
  return tickEnabled * mark * radial;
}

vec3 ringNode(vec2 p, float radius, float angle, vec3 tint, float pulse) {
  vec2 direction = vec2(cos(angle), sin(angle));
  vec2 node = direction * radius;
  float sharp = pointMask(p, node, 0.010);
  float halo = exp(-pow(length(p - node) / 0.036, 2.0));
  float flare = capsule(p, node - direction * 0.025, node + direction * 0.040, 0.0018);
  return RING_CYAN_WHITE * sharp * pulse + tint * halo * 0.18 * pulse + RING_CYAN_WHITE * flare * 0.26 * pulse;
}

vec3 reactorDataBlock(vec2 p, vec2 center, float size, vec3 tint, float pulse) {
  vec2 delta = abs(p - center);
  float square = 1.0 - smoothstep(size, size + AA * 2.0, max(delta.x, delta.y));
  return tint * square * pulse;
}

vec3 layerInnerRings(vec2 p, float t) {
  vec2 q = p / INNER_CORE_SCALE;
  vec3 color = vec3(0.0);
  float p2 = dot(p, p);
  if (p2 < 0.0064 || p2 > 0.120) return color;
  float r = length(q);
  float energyPulse = 1.0;

  // Low-opacity depth illumination: warm near the core, blue through the web,
  // and a faint outer falloff so the assembly never cuts directly into black.
  float warmAmbient = exp(-pow(r / 0.70, 2.0));
  float cyanAmbient = exp(-pow((r - 0.88) / 0.40, 2.0));
  float outerAmbient = exp(-pow((r - 1.34) / 0.31, 2.0));
  float warmRecessGlow = exp(-pow((r - 0.585) / 0.125, 2.0));
  // Warm-white receiver immediately behind the reactor: it catches the core
  // bloom while remaining a soft recess rather than a new solid ring.
  float coreWarmBed = exp(-pow((r - 0.485) / 0.135, 2.0));
  float coreHotBed = exp(-pow((r - 0.515) / 0.070, 2.0));
  float cyanRecessGlow = exp(-pow((r - 0.820) / 0.220, 2.0));
  color += RING_ORANGE_DARK * warmAmbient * 0.040 * energyPulse;
  color += RING_BLUE_DARK * cyanAmbient * 0.055;
  color += RING_BLUE_DEEP * outerAmbient * 0.040;
  color += RING_ORANGE_LIGHT * coreWarmBed * 0.075;
  color += RING_ORANGE_WHITE * coreHotBed * 0.038;
  // Low-frequency atmosphere for the dark recesses: visible only as depth,
  // never as an additional ring or a bright flat fill.
  color += RING_AMBER * warmRecessGlow * 0.018 * energyPulse;
  color += RING_CYAN_DIM * cyanRecessGlow * 0.024;

  // 1–3: compact hot containment. The former two dark spacer bands were
  // removed so the reactor housing begins close to the locked core.
  color += energyRing(q, 0.505, 0.0032, RING_AMBER, RING_AMBER_HIGHLIGHT, 0.74);
  color += orangeContainment(q, 0.535);
  color += energyRing(q, 0.560, 0.0022, RING_AMBER, RING_ORANGE, 0.58);
  color += energyRing(q, 0.575, 0.0015, RING_ORANGE_DARK, RING_ORANGE, 0.46);
  color += RING_AMBER_HIGHLIGHT * arcMask(q, 0.560, 0.0026, 1.17, 0.11) * 0.76;
  color += RING_AMBER * arcMask(q, 0.575, 0.0018, 4.42, 0.14) * 0.56;

  // 4–6: cyan rings pulled inward with a deliberately narrow animated recess.
  color += transitionRing(q, 0.588) * energyPulse;
  color += energyRing(q, 0.605, 0.0220, RING_CYAN, RING_CYAN_BRIGHT, 0.88 * energyPulse);
  float transitionRotation = 0.0;
  color += RING_AMBER_HIGHLIGHT * arcMask(q, 0.588, 0.0038, 0.44 + transitionRotation, 0.19) * (0.72 + 0.08 * energyPulse);
  color += RING_AMBER * arcGlow(q, 0.588, 0.0045, 0.44 + transitionRotation, 0.19) * 0.16;
  float dashRotation = 0.0;
  color += RING_CYAN_DIM * radialDash(q, 0.630, 40.0, 0.22, 0.0030, dashRotation) * 0.74;
  color += RING_CYAN_BRIGHT * radialDash(q, 0.630, 20.0, 0.13, 0.0034, dashRotation) * 0.42;

  // Narrow dark recessed channel: subtle, counter-rotating energy detail keeps
  // it alive without reopening the large gap around the core.
  color += RING_BLUE_DEEP * innerBand(q, 0.646, 0.673) * 0.40;
  color += RING_BLUE_DARK * innerSectorFill(q, 0.646, 0.673, 16.0, 0.06) * 0.30;
  color += RING_CYAN_DIM * innerSectorEdges(q, 0.646, 0.673, 16.0, 0.06) * 0.14;
  float recessRotation = 0.0;
  color += RING_CYAN_DIM * reactorTicks(q, 0.659, 32.0, recessRotation, 0.0) * 0.35;
  color += cyanArc(q, 0.659, 0.0028, 1.06 + recessRotation, 0.42, RING_CYAN_DIM, 0.30);
  color += orangeArc(q, 0.659, 0.0024, 4.18 - recessRotation, 0.11, 0.42);

  // 7–10: paired technical lines, clock-wise 64 ticks, and amber dash belt.
  color += energyRing(q, 0.695, 0.0140, RING_CYAN_DIM, RING_CYAN, 0.56);

  // Compact secondary belt, moved inward with the immediate cyan assembly.
  color += energyRing(q, 0.725, 0.0140, RING_CYAN_DIM, RING_CYAN, 0.56);
  float tickRotation = 0.0;
  color += RING_CYAN_DIM * reactorTicks(q, 0.754, 64.0, tickRotation, 0.0) * 0.72;
  color += RING_CYAN_BRIGHT * reactorTicks(q, 0.754, 64.0, tickRotation, 1.0) * 0.56;
  // Eight thick, glowing amber interruptions move at twice their former speed.
  float amberRotation = t * INNER_RING_SPEED_SLOW * 2.3184;
  color += RING_ORANGE_DARK * radialDash(q, 0.784, 48.0, 0.19, 0.0018, amberRotation) * 0.62;
  for (int i = 0; i < 8; i++) {
    float index = float(i);
    float angle = 0.24 + index * TAU / 8.0 + amberRotation;
    float span = mix(0.14, 0.23, mod(index, 3.0) * 0.5);
    float width = mix(0.0150, 0.0180, mod(index, 2.0));
    float strength = mix(0.54, 0.72, mod(index, 2.0));
    color += orangeArc(q, 0.784, width, angle, span, strength);
    color += RING_AMBER * arcGlow(q, 0.784, width * 1.15, angle, span) * 0.22;
  }

  // Slow data fragments fill the dark band between the amber dashes and the
  // interrupted cyan belt without becoming another continuous ring.
  float dataRotation = 0.0;
  for (int i = 0; i < 8; i++) {
    float index = float(i);
    float angle = 0.16 + index * TAU / 8.0 + dataRotation;
    float radius = 0.873 + mod(index, 3.0) * 0.024;
    vec2 position = vec2(cos(angle), sin(angle)) * radius;
    float pulse = 0.82;
    color += reactorDataBlock(q, position, 0.0090, RING_CYAN_BRIGHT, pulse);
  }
  for (int i = 0; i < 4; i++) {
    float angle = 0.72 + float(i) * TAU / 4.0 - dataRotation * 0.68;
    vec2 position = vec2(cos(angle), sin(angle)) * 0.914;
    color += reactorDataBlock(q, position, 0.0065, RING_AMBER, 0.70);
  }

  // 11: stationary segmented reactor web, three radial levels and diagonal braces.
  color += RING_BLUE_DEEP * innerBand(q, 0.842, 1.012) * 0.34;
  color += RING_BLUE_DARK * innerSectorFill(q, 0.842, 0.902, 18.0, 0.00) * 0.30;
  color += RING_BLUE_DARK * innerSectorFill(q, 0.900, 0.957, 16.0, 0.10) * 0.26;
  color += RING_BLUE_DEEP * innerSectorFill(q, 0.955, 1.012, 20.0, -0.08) * 0.42;
  color += RING_CYAN_DIM * innerSectorEdges(q, 0.842, 0.902, 18.0, 0.00) * 0.14;
  color += RING_BLUE_DARK * innerSectorEdges(q, 0.900, 0.957, 16.0, 0.10) * 0.54;
  color += RING_CYAN_DIM * innerSectorEdges(q, 0.955, 1.012, 20.0, -0.08) * 0.12;
  for (int i = 0; i < 10; i++) {
    float a = 0.13 + float(i) * TAU / 10.0;
    vec2 d = vec2(cos(a), sin(a));
    vec2 n = vec2(-d.y, d.x);
    color += RING_BLUE_DARK * capsule(q, d * 0.850 + n * 0.020, d * 0.945 - n * 0.035, 0.0055) * 0.58;
    color += RING_CYAN_DIM * capsule(q, d * 0.964 - n * 0.015, d * 1.005 + n * 0.024, 0.0034) * 0.32;
  }
  color += energyRing(q, 0.902, 0.0018, RING_CYAN_DIM, RING_BLUE_DARK, 0.42);
  color += energyRing(q, 0.957, 0.0014, RING_BLUE_DARK, RING_CYAN_DIM, 0.48);

  // 12–13: irregular segmented cyan belt plus dense micro blocks and dot detail.
  float segmentRotation = 0.0;
  color += energyRing(q, 1.025, 0.0030, RING_BLUE_DARK, RING_CYAN_DIM, 0.62);
  color += cyanArc(q, 1.025, 0.0080, 0.14 + segmentRotation, 0.26, RING_CYAN_BRIGHT, 0.78);
  color += cyanArc(q, 1.025, 0.0050, 1.10 + segmentRotation, 0.17, RING_CYAN_DIM, 0.54);
  color += cyanArc(q, 1.025, 0.0090, 2.34 + segmentRotation, 0.38, RING_CYAN_BRIGHT, 0.76);
  color += cyanArc(q, 1.025, 0.0050, 3.48 + segmentRotation, 0.20, RING_CYAN, 0.58);
  color += cyanArc(q, 1.025, 0.0070, 4.68 + segmentRotation, 0.31, RING_CYAN_BRIGHT, 0.72);
  color += cyanArc(q, 1.025, 0.0040, 5.76 + segmentRotation, 0.12, RING_CYAN_DIM, 0.48);
  float microRotation = 0.0;
  color += RING_BLUE_DARK * radialDash(q, 1.052, 72.0, 0.16, 0.0016, microRotation) * 0.75;
  color += RING_CYAN_DIM * radialDash(q, 1.052, 36.0, 0.10, 0.0021, microRotation) * 0.36;
  color += RING_ORANGE_LIGHT * radialDash(q, 1.052, 18.0, 0.06, 0.0018, microRotation) * 0.20;

  // 14: broad translucent cyan glass band, internally lit and structurally divided.
  float glass = innerBand(q, 1.060, 1.195);
  float glassAngle = atan(q.y, q.x);
  float glassCell = fract((glassAngle + PI) / TAU * 12.0);
  float glassInterrupt = 1.0 - smoothstep(0.34, 0.46, abs(glassCell - 0.5));
  float glassMask = glass * (1.0 - 0.54 * glassInterrupt);
  float glassCenter = exp(-pow((length(q) - 1.127) / 0.052, 2.0));
  color += RING_BLUE_DARK * glassMask * 0.50;
  color += RING_CYAN_DIM * glassMask * glassCenter * 0.24 * energyPulse;
  color += energyRing(q, 1.060, 0.0150, RING_CYAN, RING_CYAN_BRIGHT, 0.80 * energyPulse);
  // Four heavy illuminated sections replace the continuous outer glow.
  float outerSectionRotation = -t * INNER_RING_SPEED_SLOW * 2.576;
  for (int i = 0; i < 4; i++) {
    float sectionAngle = 0.30 + float(i) * TAU / 4.0 + outerSectionRotation;
    color += cyanArc(q, 1.195, 0.0280, sectionAngle, 1.30, RING_CYAN_WHITE, 0.84 * energyPulse);
  }
  color += RING_CYAN_DIM * ringMask(q, 1.127, 0.0020) * 0.46;
  for (int i = 0; i < 14; i++) {
    float a = 0.07 + float(i) * TAU / 14.0;
    vec2 d = vec2(cos(a), sin(a));
    color += RING_CYAN_DIM * capsule(q, d * 1.068, d * 1.187, 0.0018) * 0.40;
  }
  float glassSweep = -t * 1.0143;
  // Three matching fast sweeps on separate outer levels instead of one lone runner.
  color += cyanArc(q, 1.195, 0.0080, 0.62 + glassSweep, 0.20, RING_CYAN_WHITE, 0.92);
  color += cyanArc(q, 1.145, 0.0070, 2.71 + glassSweep, 0.22, RING_CYAN_BRIGHT, 0.74);
  color += cyanArc(q, 1.090, 0.0065, 4.80 + glassSweep, 0.20, RING_CYAN_BRIGHT, 0.68);

  // 15–16: uneven closing rim, cyan arcs and distributed orange accents.
  color += RING_BLUE_DEEP * innerBand(q, 1.193, 1.214) * 0.36;
  color += energyRing(q, 1.214, 0.0024, RING_BLUE_DARK, RING_CYAN_DIM, 0.70);
  color += energyRing(q, 1.236, 0.0110, RING_CYAN_DIM, RING_CYAN, 0.62);
  float closeRotation = 0.0;
  color += cyanArc(q, 1.278, 0.0060, 0.12 + closeRotation, 0.31, RING_CYAN_BRIGHT, 0.74);
  color += cyanArc(q, 1.278, 0.0040, 1.46 + closeRotation, 0.20, RING_CYAN, 0.56);
  color += cyanArc(q, 1.278, 0.0065, 2.70 + closeRotation, 0.35, RING_CYAN_BRIGHT, 0.76);
  color += cyanArc(q, 1.278, 0.0040, 4.04 + closeRotation, 0.18, RING_CYAN_DIM, 0.50);
  color += cyanArc(q, 1.278, 0.0055, 5.22 + closeRotation, 0.28, RING_CYAN_BRIGHT, 0.70);
  color += orangeArc(q, 1.258, 0.0035, 0.92 + closeRotation, 0.13, 0.50);
  color += orangeArc(q, 1.258, 0.0035, 3.24 + closeRotation, 0.16, 0.54);
  color += orangeArc(q, 1.258, 0.0030, 5.68 + closeRotation, 0.11, 0.46);

  // A fading outer suggestion of continuing machinery, leaving black space for
  // the next assembly instead of ending the current rim abruptly.
  color += energyRing(q, 1.330, 0.0018, RING_BLUE_DARK, RING_BLUE_DEEP, 0.34);
  color += energyRing(q, 1.382, 0.0013, RING_BLUE_DEEP, RING_BLUE_DARK, 0.26);
  color += energyRing(q, 1.438, 0.0010, RING_BLUE_DEEP, RING_BLUE_DEEP, 0.18);
  color += cyanArc(q, 1.330, 0.0025, 2.22, 0.16, RING_CYAN_DIM, 0.28);
  color += cyanArc(q, 1.382, 0.0020, 5.14, 0.11, RING_CYAN_DIM, 0.20);

  // Four compact intersections: attached to rings, never screen-wide axes.
  float nodePulseA = 0.88;
  float nodePulseB = 0.82;
  float nodePulseC = 0.84;
  color += ringNode(q, 0.605, 0.04, RING_CYAN_BRIGHT, nodePulseA);
  color += ringNode(q, 0.659, 1.48, RING_CYAN_DIM, nodePulseB * 0.62);
  color += ringNode(q, 0.659, 3.58, RING_CYAN_DIM, nodePulseC * 0.58);
  color += ringNode(q, 0.659, 5.69, RING_CYAN_DIM, nodePulseA * 0.60);
  color += ringNode(q, 0.754, 2.18, RING_CYAN, nodePulseB);
  color += ringNode(q, 1.195, 4.06, RING_CYAN_BRIGHT, nodePulseC);
  color += ringNode(q, 1.278, 5.88, RING_CYAN, nodePulseA * 0.90);
  vec2 warmDirection = vec2(cos(0.32), sin(0.32));
  vec2 warmNode = warmDirection * 0.784;
  float warmSharp = pointMask(q, warmNode, 0.008);
  float warmHalo = exp(-pow(length(q - warmNode) / 0.030, 2.0));
  color += RING_ORANGE_WHITE * warmSharp * nodePulseB + RING_ORANGE_LIGHT * warmHalo * 0.20 * nodePulseB;
  return color;
}
