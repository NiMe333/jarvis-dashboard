vec3 energyStreak(vec2 p, float radius, float angle, float span, float width, vec3 tint, float strength) {
  float sharp = arcMask(p, radius, width, angle, span);
  float halo = arcGlow(p, radius, width * 2.3, angle, span);
  return tint * sharp * strength + tint * halo * 0.12 * strength;
}

vec3 layerEnergy(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float r2 = dot(p, p);
  if (r2 < 0.105 || r2 > 0.555) return color;
  float pulse = 1.0;
  float drift = t * 0.05635;

  float cyanA = arcMask(p, 0.705, 0.006, 0.12 + drift, 0.30);
  float cyanB = arcMask(p, 0.705, 0.004, 3.48 - drift, 0.23);
  float cyanC = arcMask(p, 0.585, 0.006, 4.80 + drift, 0.27);
  float orangeA = arcMask(p, 0.675, 0.007, 1.94 - drift, 0.34);
  float orangeB = arcMask(p, 0.535, 0.006, 3.62 + drift, 0.26);
  float orangeC = arcMask(p, 0.447, 0.005, 5.45 - drift, 0.22);

  color += HUD_CYAN_BRIGHT * cyanA * 1.25;
  color += HUD_CYAN * cyanB * 1.05;
  color += HUD_CYAN_BRIGHT * cyanC * 1.10;
  color += HUD_ORANGE_BRIGHT * orangeA * pulse * 1.28;
  color += HUD_ORANGE * orangeB * pulse * 1.18;
  color += HUD_ORANGE_BRIGHT * orangeC * pulse * 1.12;
  color += HUD_CYAN * arcGlow(p, 0.705, 0.010, 0.12 + drift, 0.30) * 0.34;
  color += HUD_ORANGE * arcGlow(p, 0.675, 0.012, 1.94 - drift, 0.34) * pulse * 0.35;

  // Independent sharp sweeps close the inner-to-housing transition.
  color += energyStreak(p, 0.372, 0.40 - t * 0.094, 0.16, 0.0018, HUD_CYAN_BRIGHT, 0.90);
  color += energyStreak(p, 0.416, 2.82, 0.20, 0.0017, HUD_CYAN, 0.74);
  color += energyStreak(p, 0.468, 4.68, 0.15, 0.0020, HUD_ORANGE_BRIGHT, 0.86);
  color += energyStreak(p, 0.536, 1.36, 0.24, 0.0019, HUD_CYAN_BRIGHT, 0.70);
  color += energyStreak(p, 0.616, 5.36, 0.18, 0.0020, HUD_ORANGE, 0.76);

  // A few deliberately placed energy nodes keep the visual hierarchy sparse.
  vec2 nodeA = vec2(cos(0.12 + drift), sin(0.12 + drift)) * 0.705;
  vec2 nodeB = vec2(cos(1.94 - drift), sin(1.94 - drift)) * 0.675;
  color += HUD_CYAN_BRIGHT * pointMask(p, nodeA, 0.009) * 1.45;
  color += HUD_ORANGE_BRIGHT * pointMask(p, nodeB, 0.008) * pulse * 1.35;
  return color;
}
