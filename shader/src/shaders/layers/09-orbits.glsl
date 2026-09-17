vec2 orbitPoint(float radius, float flatten, float rotation, float angle) {
  vec2 q = vec2(cos(angle) * radius, sin(angle) * radius * flatten);
  return rotate2d(q, rotation);
}

vec3 layerOrbits(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float drift = t * 0.026;
  color += HUD_CYAN * orbitalEllipse(p, 0.705, 0.33, 0.20, 0.0015) * 0.80;
  color += HUD_CYAN_BRIGHT * orbitalEllipse(p, 0.690, 0.40, -0.78, 0.0012) * 0.58;
  color += HUD_CYAN * orbitalEllipse(p, 0.655, 0.28, 0.82, 0.0011) * 0.50;
  color += HUD_CYAN_DARK * orbitalEllipse(p, 0.790, 0.52, -0.42, 0.0020) * 0.65;

  vec2 a = orbitPoint(0.705, 0.33, 0.20, 0.75 + drift);
  vec2 b = orbitPoint(0.705, 0.33, 0.20, 0.75 + PI + drift);
  vec2 c = orbitPoint(0.690, 0.40, -0.78, 2.85 - drift);
  color += HUD_CYAN_BRIGHT * pointMask(p, a, 0.0075) * 1.35;
  color += HUD_CYAN_BRIGHT * pointMask(p, b, 0.0050) * 0.95;
  color += HUD_CYAN_BRIGHT * pointMask(p, c, 0.0060) * 1.10;
  color += HUD_CYAN * orbitalGlow(p, 0.705, 0.33, 0.20) * 0.14;
  return color;
}
