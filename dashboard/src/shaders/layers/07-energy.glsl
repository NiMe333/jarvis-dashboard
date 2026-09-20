// -----------------------------------------------------------------------------
// JARVIS HUD — Optimized glowing energy layer
// More visible orange energy, fewer duplicated mask calculations.
// -----------------------------------------------------------------------------

vec3 energyStreak(
  vec2 p,
  float radius,
  float angle,
  float span,
  float width,
  vec3 tint,
  float strength
) {
  float sharp = arcMask(
    p,
    radius,
    width,
    angle,
    span
  );

  float halo = arcGlow(
    p,
    radius,
    width * 2.65,
    angle,
    span
  );

  // Bright center plus a wider colored halo.
  vec3 hotTint = mix(
    tint,
    vec3(1.0),
    0.28
  );

  return tint * sharp * strength
    + hotTint * sharp * sharp * strength * 0.30
    + tint * halo * strength * 0.24;
}

vec3 energyNode(
  vec2 p,
  float radius,
  float angle,
  float size,
  vec3 tint,
  float strength
) {
  vec2 direction = vec2(
    cos(angle),
    sin(angle)
  );

  vec2 position = direction * radius;

  float core = pointMask(
    p,
    position,
    size
  );

  float glow = pointMask(
    p,
    position,
    size * 2.8
  );

  return mix(tint, vec3(1.0), 0.32)
      * core
      * strength
    + tint
      * glow
      * 0.20
      * strength;
}

vec3 layerEnergy(vec2 p, float t) {
  vec3 color = vec3(0.0);
  float r2 = dot(p, p);

  // Covers only radius 0.324–0.745. Everything else exits immediately.
  if (r2 < 0.105 || r2 > 0.555) {
    return color;
  }

  float drift = t * 0.05635;
  float fastDrift = t * 0.094;
  float reverseDrift = -drift;

  // ---------------------------------------------------------------------------
  // Main outer energy streaks
  // Every visible element receives a sharp core and colored glow.
  // ---------------------------------------------------------------------------

  color += energyStreak(
    p, 0.705,
    0.12 + drift,
    0.34, 0.0070,
    HUD_CYAN_BRIGHT, 1.18
  );

  color += energyStreak(
    p, 0.705,
    3.48 + reverseDrift,
    0.27, 0.0055,
    HUD_CYAN, 0.96
  );

  color += energyStreak(
    p, 0.675,
    1.94 + reverseDrift,
    0.44, 0.0100,
    HUD_ORANGE_BRIGHT, 1.34
  );

  color += energyStreak(
    p, 0.635,
    4.12 + drift * 0.82,
    0.34, 0.0085,
    HUD_ORANGE, 1.16
  );

  color += energyStreak(
    p, 0.585,
    4.80 + drift,
    0.29, 0.0065,
    HUD_CYAN_BRIGHT, 1.02
  );

  color += energyStreak(
    p, 0.535,
    3.62 + drift,
    0.35, 0.0085,
    HUD_ORANGE_BRIGHT, 1.20
  );

  color += energyStreak(
    p, 0.492,
    0.86 + reverseDrift * 0.74,
    0.28, 0.0070,
    HUD_ORANGE, 1.04
  );

  color += energyStreak(
    p, 0.447,
    5.45 + reverseDrift,
    0.28, 0.0065,
    HUD_ORANGE_BRIGHT, 1.16
  );

  // ---------------------------------------------------------------------------
  // Inner-to-housing transition streaks
  // ---------------------------------------------------------------------------

  color += energyStreak(
    p, 0.372,
    0.40 - fastDrift,
    0.19, 0.0024,
    HUD_CYAN_BRIGHT, 0.86
  );

  color += energyStreak(
    p, 0.416,
    2.82 + drift * 0.42,
    0.23, 0.0023,
    HUD_ORANGE_BRIGHT, 0.88
  );

  color += energyStreak(
    p, 0.468,
    4.68 + reverseDrift * 0.55,
    0.21, 0.0027,
    HUD_ORANGE_BRIGHT, 1.00
  );

  color += energyStreak(
    p, 0.536,
    1.36 + drift * 0.36,
    0.25, 0.0025,
    HUD_CYAN_BRIGHT, 0.68
  );

  color += energyStreak(
    p, 0.616,
    5.36 + reverseDrift * 0.70,
    0.25, 0.0028,
    HUD_ORANGE, 0.92
  );

  // ---------------------------------------------------------------------------
  // Sparse energy nodes attached to the strongest streaks
  // ---------------------------------------------------------------------------

  color += energyNode(
    p, 0.705,
    0.12 + drift,
    0.0085,
    HUD_CYAN_BRIGHT, 1.25
  );

  color += energyNode(
    p, 0.675,
    1.94 + reverseDrift,
    0.0095,
    HUD_ORANGE_BRIGHT, 1.42
  );

  color += energyNode(
    p, 0.535,
    3.62 + drift,
    0.0080,
    HUD_ORANGE, 1.18
  );

  color += energyNode(
    p, 0.447,
    5.45 + reverseDrift,
    0.0075,
    HUD_ORANGE_BRIGHT, 1.12
  );

  return color;
}
