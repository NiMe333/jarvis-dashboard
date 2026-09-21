// -----------------------------------------------------------------------------
// JARVIS HUD — Layer 03: structured circular command network
// The complete scaffold is static and rendered once. Only the small activity
// function is evaluated with the animated core.
// -----------------------------------------------------------------------------

float coreNetworkSafeMask(vec2 p, float radius) {
  float reactorClear = smoothstep(0.69, 0.745, radius);
  float cardEdgeFade = 1.0 - smoothstep(0.82, 0.94, max(abs(p.x), abs(p.y)));
  float titleClear = 1.0 - smoothstep(0.62, 0.79, p.y);
  float telemetryClear = smoothstep(-0.79, -0.62, p.y);
  return reactorClear * cardEdgeFade * titleClear * telemetryClear;
}

float coreNetworkAngle(int index) {
  if (index == 0) return radians(12.0);
  if (index == 1) return radians(34.0);
  if (index == 2) return radians(57.0);
  if (index == 3) return radians(82.0);
  if (index == 4) return radians(108.0);
  if (index == 5) return radians(136.0);
  if (index == 6) return radians(161.0);
  if (index == 7) return radians(188.0);
  if (index == 8) return radians(214.0);
  if (index == 9) return radians(239.0);
  if (index == 10) return radians(266.0);
  if (index == 11) return radians(294.0);
  if (index == 12) return radians(318.0);
  return radians(342.0);
}

float coreNetworkNodeRadius(int index) {
  int band = index - (index / 4) * 4;
  if (band == 0) return 0.785;
  if (band == 1) return 0.865;
  if (band == 2) return 0.945;
  return 0.855;
}

bool coreNetworkOutlinedNode(int index) {
  return index == 0 || index == 4 || index == 6 || index == 10 || index == 12;
}

bool coreNetworkAmberNode(int index) {
  return index == 3 || index == 8 || index == 12;
}

bool coreNetworkCalibration(int index) {
  return index == 1 || index == 5 || index == 9 || index == 13;
}

float coreNetworkGuideArcs(float radius, float angle) {
  float guides = 0.0;

  // Four independent guide radii. Each is split into coherent quadrant arcs.
  guides += arcMaskPolar(radius, angle, 0.785, 0.00105,  0.70, 0.76) * 0.18;
  guides += arcMaskPolar(radius, angle, 0.785, 0.00105, -2.35, 0.88) * 0.16;
  guides += arcMaskPolar(radius, angle, 0.865, 0.00090,  2.33, 0.92) * 0.16;
  guides += arcMaskPolar(radius, angle, 0.865, 0.00090, -0.72, 0.82) * 0.15;
  guides += arcMaskPolar(radius, angle, 0.945, 0.00080,  2.96, 0.68) * 0.13;
  guides += arcMaskPolar(radius, angle, 0.945, 0.00080, -0.04, 0.76) * 0.14;
  guides += arcMaskPolar(radius, angle, 1.035, 0.00070,  1.98, 0.64) * 0.10;
  guides += arcMaskPolar(radius, angle, 1.035, 0.00070, -1.02, 0.70) * 0.11;

  // Four short data sequences remain attached to their guide sections.
  guides += radialDashPolar(radius, angle, 0.785, 84.0, 0.11, 0.0012, 0.12)
          * arcMaskPolar(radius, angle, 0.785, 0.010, 0.18, 0.40) * 0.17;
  guides += radialDashPolar(radius, angle, 0.865, 92.0, 0.10, 0.0011, 0.31)
          * arcMaskPolar(radius, angle, 0.865, 0.010, 2.78, 0.44) * 0.15;
  guides += radialDashPolar(radius, angle, 0.945, 100.0, 0.09, 0.0010, 0.06)
          * arcMaskPolar(radius, angle, 0.945, 0.010, -2.02, 0.42) * 0.13;
  guides += radialDashPolar(radius, angle, 1.035, 108.0, 0.08, 0.0009, 0.24)
          * arcMaskPolar(radius, angle, 1.035, 0.010, -0.42, 0.38) * 0.11;
  return guides;
}

vec3 layerCoreNetworkStatic(vec2 p, int stage) {
  float radius = length(p);
  if (radius < 0.66 || radius > 1.18) return vec3(0.0);

  float angle = atan(p.y, p.x);
  float primary = 0.0;
  float primaryGlow = 0.0;
  float secondary = 0.0;
  float guide = coreNetworkGuideArcs(radius, angle);
  float cyanPoints = 0.0;
  float outlinedNodes = 0.0;
  float amberPoints = 0.0;
  float nodeHalos = 0.0;
  float calibration = 0.0;

  for (int i = 0; i < 14; i++) {
    float indexedAngle = coreNetworkAngle(i);
    vec2 direction = vec2(cos(indexedAngle), sin(indexedAngle));
    vec2 tangent = vec2(-direction.y, direction.x);
    float nodeRadius = coreNetworkNodeRadius(i);
    vec2 startPoint = direction * 0.705;
    vec2 nodePoint = direction * nodeRadius;
    float hierarchy = (i == 1 || i == 5 || i == 8 || i == 12) ? 0.44 : 0.34;
    float outwardFade = 1.0 - 0.30 * smoothstep(0.70, nodeRadius, radius);

    primary += capsule(p, startPoint, nodePoint, 0.00135) * hierarchy * outwardFade;
    if (i == 1 || i == 5 || i == 8 || i == 12) {
      primaryGlow += capsule(p, startPoint, nodePoint, 0.0060) * 0.035 * outwardFade;
    }
    cyanPoints += pointMask(p, nodePoint, 0.0030) * 0.38;

    if (coreNetworkOutlinedNode(i)) {
      outlinedNodes += ringMask(p - nodePoint, 0.0070, 0.00095) * 0.34;
    }
    if (coreNetworkAmberNode(i)) {
      amberPoints += pointMask(p, nodePoint, 0.0038) * 0.48;
      nodeHalos += pointMask(p, nodePoint, 0.014) * 0.08;
    }
    if (coreNetworkCalibration(i)) {
      calibration += capsule(
        p,
        nodePoint - tangent * 0.014,
        nodePoint + tangent * 0.014,
        0.00125
      ) * 0.30;
    }

    // Seven controlled branches: radial path → node → one 45° bend → a
    // horizontal or vertical termination. There are no multi-turn zigzags.
    if (i == 0 || i == 2 || i == 4 || i == 7 || i == 9 || i == 11 || i == 13) {
      float branchSign = (i == 2 || i == 7 || i == 11) ? -1.0 : 1.0;
      vec2 diagonal = normalize(vec2(sign(direction.x), branchSign * sign(direction.y)));
      vec2 bendPoint = nodePoint + diagonal * 0.060;
      vec2 axis = abs(direction.x) > abs(direction.y)
        ? vec2(sign(direction.x), 0.0)
        : vec2(0.0, sign(direction.y));
      vec2 terminalPoint = bendPoint + axis * 0.052;

      secondary += capsule(p, nodePoint, bendPoint, 0.00090) * 0.23;
      secondary += capsule(p, bendPoint, terminalPoint, 0.00090) * 0.20;
      cyanPoints += pointMask(p, bendPoint, 0.0026) * 0.30;
      cyanPoints += pointMask(p, terminalPoint, 0.0028) * 0.34;
      if (i == 0 || i == 4 || i == 9 || i == 13) {
        outlinedNodes += ringMask(p - terminalPoint, 0.0060, 0.00085) * 0.30;
      }
    }
  }

  bool primaryOnly = stage == 1;
  bool guidesOnly = stage == 2;
  bool connections = stage == 3;
  bool withNodes = stage == 4;
  bool withBends = stage == 5;
  bool withHighlights = stage == 6;
  bool finalStage = stage == 0 || stage >= 7;

  vec3 color = vec3(0.0);
  if (primaryOnly) color += HUD_CYAN * primary + HUD_CYAN_BRIGHT * primaryGlow;
  if (guidesOnly) color += HUD_CYAN_DARK * guide * 1.55;
  if (connections || withNodes || withBends || withHighlights || finalStage) {
    color += HUD_CYAN * primary;
    color += HUD_CYAN_BRIGHT * primaryGlow;
    color += HUD_CYAN_DARK * guide * 1.55;
  }
  if (withNodes || withBends || withHighlights || finalStage) {
    color += HUD_CYAN_BRIGHT * cyanPoints;
    color += HUD_CYAN * (outlinedNodes + calibration);
  }
  if (withBends || withHighlights || finalStage) {
    color += HUD_CYAN * secondary;
  }
  if (withHighlights || finalStage) {
    color += HUD_ORANGE * amberPoints;
    color += HUD_ORANGE * nodeHalos;
  }

  return color * coreNetworkSafeMask(p, radius);
}

vec3 layerCoreNetworkActivity(vec2 p, float t) {
  float radius = length(p);
  float angle = atan(p.y, p.x);
  float mask = coreNetworkSafeMask(p, radius);

  // One cyan packet moves out along the 34 degree primary connection.
  float cyanProgress = fract(t * 0.012);
  float cyanAngle = radians(34.0);
  vec2 cyanDirection = vec2(cos(cyanAngle), sin(cyanAngle));
  vec2 cyanPulse = cyanDirection * mix(0.71, 0.865, cyanProgress);
  float cyanActive = pointMask(p, cyanPulse, 0.0040) * 0.48;
  float cyanHalo = pointMask(p, cyanPulse, 0.0140) * 0.08;

  // One amber packet travels only across a selected lower-left guide arc.
  float amberProgress = fract(t * 0.008);
  float amberAngle = mix(radians(204.0), radians(244.0), amberProgress);
  vec2 amberPulse = vec2(cos(amberAngle), sin(amberAngle)) * 0.945;
  float amberActive = pointMask(p, amberPulse, 0.0038) * 0.46;
  float amberHalo = pointMask(p, amberPulse, 0.0130) * 0.075;

  // A single dotted sequence drifts while one faint outer guide turns slowly.
  float movingDots = radialDashPolar(radius, angle, 0.865, 92.0, 0.10, 0.0011, t * -0.006)
                   * arcMaskPolar(radius, angle, 0.865, 0.010, 2.78, 0.44) * 0.16;
  float movingGuide = arcMaskPolar(radius, angle, 1.035, 0.00075, -1.02 + t * 0.006, 0.70) * 0.08;

  vec3 color = HUD_CYAN_BRIGHT * (cyanActive + cyanHalo);
  color += HUD_ORANGE_BRIGHT * (amberActive + amberHalo);
  color += HUD_CYAN * movingDots;
  color += HUD_CYAN_DARK * movingGuide;
  return color * mask;
}
