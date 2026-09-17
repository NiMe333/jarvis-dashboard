vec3 layerInnerRings(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float spin = t * 0.026;
  color += HUD_CYAN * ringMask(p, 0.535, 0.0014) * 0.72;
  color += HUD_CYAN_DARK * ringMask(p, 0.510, 0.0040) * 0.72;
  color += HUD_CYAN * ringMask(p, 0.474, 0.0015) * 0.75;
  color += HUD_CYAN_DARK * ringMask(p, 0.447, 0.0020) * 0.55;
  color += HUD_CYAN * ringMask(p, 0.403, 0.0010) * 0.62;
  color += HUD_CYAN_DARK * ringMask(p, 0.365, 0.0030) * 0.72;
  color += HUD_CYAN * ringMask(p, 0.326, 0.0011) * 0.65;
  color += HUD_CYAN_DARK * ringMask(p, 0.292, 0.0022) * 0.70;

  color += HUD_CYAN * tickRing(p, 0.492, 96.0, 0.004, 0.014) * 0.75;
  color += HUD_CYAN_BRIGHT * tickRing(p, 0.422, 72.0, 0.003, 0.012) * 0.58;
  color += HUD_ORANGE * tickRing(p, 0.385, 52.0, 0.003, 0.011) * 0.46;
  color += HUD_CYAN * radialDash(p, 0.345, 44.0, 0.17, 0.0020, spin) * 0.58;

  color += HUD_CYAN_BRIGHT * arcMask(p, 0.535, 0.0030, 1.1 + spin, 0.47) * 0.68;
  color += HUD_CYAN * arcMask(p, 0.474, 0.0025, 3.85 - spin, 0.72) * 0.68;
  color += HUD_ORANGE * arcMask(p, 0.403, 0.0030, 5.18 + spin, 0.50) * 0.75;
  color += HUD_CYAN * arcMask(p, 0.326, 0.0025, 2.20 - spin, 0.60) * 0.58;
  return color;
}
