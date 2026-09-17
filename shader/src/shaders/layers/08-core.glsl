vec3 layerCore(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float breathe = 0.92 + 0.08 * sin(t * 1.6);
  float spin = t * 0.045;

  color += HUD_CYAN_DARK * ringMask(p, 0.270, 0.007) * 0.9;
  color += HUD_CYAN * ringMask(p, 0.252, 0.003) * 0.85;
  color += HUD_CYAN_BRIGHT * ringMask(p, 0.218, 0.004) * 0.95;
  color += HUD_CYAN * ringMask(p, 0.184, 0.002) * 0.8;
  color += HUD_CYAN_BRIGHT * ringMask(p, 0.145, 0.004) * 1.1 * breathe;
  color += HUD_CYAN * ringMask(p, 0.116, 0.002) * 1.0;

  color += HUD_CYAN_BRIGHT * arcGlow(p, 0.145, 0.012, spin, TAU) * 0.20 * breathe;
  color += HUD_CYAN * tickRing(p, 0.234, 40.0, 0.004, 0.012) * 0.8;
  color += HUD_ORANGE * arcMask(p, 0.270, 0.004, 2.6 - spin, 0.22) * 0.65;
  color += HUD_CYAN_BRIGHT * arcMask(p, 0.218, 0.004, 5.3 + spin, 0.30) * 0.9;

  float wire = polygonEdge(p, 0.102, 6.0, spin, 0.0028);
  wire += polygonEdge(p, 0.074, 6.0, -spin + PI / 6.0, 0.0022);
  color += HUD_CYAN_BRIGHT * wire * 0.90;

  for (int i = 0; i < 3; i++) {
    float a = float(i) * PI / 3.0 + spin;
    vec2 a0 = vec2(cos(a), sin(a)) * 0.102;
    vec2 a1 = -a0;
    color += HUD_CYAN * capsule(p, a0, a1, 0.0022) * 0.72;
  }
  color += HUD_CYAN_BRIGHT * pointMask(p, vec2(0.0), 0.020) * 0.80 * breathe;
  return color;
}
