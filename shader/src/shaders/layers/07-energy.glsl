vec3 layerEnergy(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float pulse = 0.82 + 0.18 * sin(t * 1.35);
  float drift = t * 0.035;

  float cyanA = arcMask(p, 0.705, 0.006, 0.12 + drift, 0.30);
  float cyanB = arcMask(p, 0.705, 0.004, 3.48 - drift, 0.23);
  float cyanC = arcMask(p, 0.585, 0.006, 4.80 + drift, 0.27);
  float orangeA = arcMask(p, 0.675, 0.007, 1.94 - drift, 0.34);
  float orangeB = arcMask(p, 0.535, 0.006, 3.62 + drift, 0.26);
  float orangeC = arcMask(p, 0.447, 0.005, 5.45 - drift, 0.22);

  color += HUD_CYAN_BRIGHT * cyanA * 1.25;
  color += HUD_CYAN * cyanB * 1.05;
  color += HUD_CYAN_BRIGHT * cyanC * 1.10;
  color += HUD_ORANGE_BRIGHT * orangeA * pulse * 1.20;
  color += HUD_ORANGE * orangeB * pulse * 1.12;
  color += HUD_ORANGE_BRIGHT * orangeC * pulse * 1.05;
  color += HUD_CYAN * arcGlow(p, 0.705, 0.010, 0.12 + drift, 0.30) * 0.34;
  color += HUD_ORANGE * arcGlow(p, 0.675, 0.010, 1.94 - drift, 0.34) * pulse * 0.32;

  // A few deliberately placed energy nodes keep the visual hierarchy sparse.
  vec2 nodeA = vec2(cos(0.12 + drift), sin(0.12 + drift)) * 0.705;
  vec2 nodeB = vec2(cos(1.94 - drift), sin(1.94 - drift)) * 0.675;
  color += HUD_CYAN_BRIGHT * pointMask(p, nodeA, 0.009) * 1.45;
  color += HUD_ORANGE_BRIGHT * pointMask(p, nodeB, 0.008) * pulse * 1.35;
  return color;
}
