vec3 layerPostEffects(vec3 color, vec2 p, float t) {
  float centerLift = 1.0 + 0.035 * (1.0 - smoothstep(0.0, 0.75, length(p)));
  color *= centerLift;
  color = max(color, vec3(0.0));
  // Soft knee keeps glow highlights controlled instead of clipping to white.
  color = color / (vec3(1.0) + color * 0.58);
  return min(color, vec3(0.92));
}
