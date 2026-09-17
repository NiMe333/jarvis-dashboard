vec3 layerParticles(vec2 p, float t) {
  vec3 color = vec3(0.0);
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float a = hash11(fi * 8.7) * TAU + t * (0.012 + hash11(fi + 3.0) * 0.018);
    float r = 0.48 + hash11(fi + 10.0) * 0.30;
    vec2 pos = vec2(cos(a), sin(a)) * r;
    float size = 0.0018 + hash11(fi + 20.0) * 0.0030;
    float particle = pointMask(p, pos, size);
    vec3 tint = hash11(fi + 30.0) > 0.78 ? HUD_ORANGE : HUD_CYAN_BRIGHT;
    color += tint * particle * (0.45 + hash11(fi + 40.0) * 0.65);
  }

  // Tiny clustered sparks at the lateral energy zones.
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float y = -0.22 + fi * 0.11 + sin(t * 0.15 + fi) * 0.012;
    vec2 left = vec2(-0.70 + hash11(fi) * 0.10, y);
    vec2 right = vec2(0.70 - hash11(fi + 6.0) * 0.10, -y);
    color += HUD_CYAN * pointMask(p, left, 0.0028 + hash11(fi) * 0.0025) * 0.72;
    color += HUD_CYAN * pointMask(p, right, 0.0028 + hash11(fi + 8.0) * 0.0025) * 0.72;
  }
  return color;
}
