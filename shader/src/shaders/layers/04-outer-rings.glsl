vec3 layerOuterRings(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float spin = t * 0.018;

  color += HUD_CYAN * ringMask(p, 0.86, 0.0012) * 0.65;
  color += HUD_CYAN_DARK * ringMask(p, 0.82, 0.0022) * 0.75;
  color += HUD_CYAN * ringMask(p, 0.765, 0.0010) * 0.45;
  color += HUD_CYAN_DARK * ringMask(p, 0.735, 0.0030) * 0.65;

  color += HUD_CYAN * tickRing(p, 0.805, 112.0, 0.006, 0.014) * 0.72;
  color += HUD_ORANGE * tickRing(p, 0.795, 84.0, 0.005, 0.011) * 0.42;
  color += HUD_CYAN_BRIGHT * radialDash(p, 0.838, 64.0, 0.19, 0.0025, spin) * 0.7;

  color += HUD_CYAN * arcMask(p, 0.855, 0.0030, 0.55 + spin, 0.88) * 0.7;
  color += HUD_CYAN_BRIGHT * arcMask(p, 0.855, 0.0012, -1.72 - spin, 0.46) * 0.85;
  color += HUD_ORANGE * arcMask(p, 0.805, 0.0025, 2.45 - spin, 0.55) * 0.74;
  color += HUD_CYAN * arcMask(p, 0.742, 0.0013, -2.25 + spin, 1.10) * 0.65;

  color += HUD_CYAN * arcGlow(p, 0.855, 0.005, 0.55 + spin, 0.88) * 0.13;
  color += HUD_ORANGE * arcGlow(p, 0.805, 0.005, 2.45 - spin, 0.55) * 0.10;

  // Small technical breaks and radial markers between the outer rings.
  color += HUD_CYAN_DARK * radialDash(p, 0.70, 42.0, 0.28, 0.0020, -spin) * 0.55;
  color += HUD_CYAN * tickRing(p, 0.705, 48.0, 0.005, 0.018) * 0.55;
  return color;
}
