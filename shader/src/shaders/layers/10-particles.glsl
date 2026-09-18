vec3 particleCross(vec2 p, vec2 center, float size, vec3 tint, float strength) {
  vec3 color = tint * capsule(p, center - vec2(size, 0.0), center + vec2(size, 0.0), 0.0009) * strength;
  color += tint * capsule(p, center - vec2(0.0, size), center + vec2(0.0, size), 0.0009) * strength;
  float haloDistance = length(p - center) / (size * 2.6);
  color += tint * exp(-(haloDistance * haloDistance)) * 0.10 * strength;
  return color;
}

vec3 particleStar(vec2 p, vec2 center, float size, vec3 tint, float strength) {
  vec3 color = particleCross(p, center, size, tint, strength * 0.70);
  vec2 diagonal = vec2(size * 0.72, size * 0.72);
  color += tint * capsule(p, center - diagonal, center + diagonal, 0.0007) * strength * 0.62;
  color += tint * capsule(p, center + vec2(-diagonal.x, diagonal.y), center + vec2(diagonal.x, -diagonal.y), 0.0007) * strength * 0.62;
  color += tint * pointMask(p, center, 0.0035) * strength;
  return color;
}

vec3 layerParticles(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float r2 = dot(p, p);
  if (r2 < 0.100 || r2 > 0.700) return color;
  // Keep the sparse particle field while avoiding eight point masks per pixel.
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float a = hash11(fi * 8.7) * TAU;
    float r = 0.48 + hash11(fi + 10.0) * 0.30;
    vec2 pos = vec2(cos(a), sin(a)) * r;
    float size = 0.0018 + hash11(fi + 20.0) * 0.0030;
    float particle = pointMask(p, pos, size);
    vec3 tint = hash11(fi + 30.0) > 0.78 ? HUD_ORANGE : HUD_CYAN_BRIGHT;
    color += tint * particle * (0.45 + hash11(fi + 40.0) * 0.65);
  }

  // Tiny clustered sparks at the lateral energy zones.
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float y = -0.22 + fi * 0.11 + sin(fi) * 0.012;
    vec2 left = vec2(-0.70 + hash11(fi) * 0.10, y);
    vec2 right = vec2(0.70 - hash11(fi + 6.0) * 0.10, -y);
    color += HUD_CYAN * pointMask(p, left, 0.0028 + hash11(fi) * 0.0025) * 0.72;
    color += HUD_CYAN * pointMask(p, right, 0.0028 + hash11(fi + 8.0) * 0.0025) * 0.72;
  }

  return color;
}
