vec3 layerGrid(vec2 p, float t) {
  float radius = length(p);
  float angle = atan(p.y, p.x);

  // ---------------------------------------------------------------------------
  // Circular grid geometry
  // ---------------------------------------------------------------------------

  // Concentric minor rings
  float minorRingCell =
    abs(fract(radius * 14.0 + 0.5) - 0.5);

  float minorRings =
    1.0 - smoothstep(0.0, 0.022, minorRingCell);

  // Stronger major rings
  float majorRingCell =
    abs(fract(radius * 5.0 + 0.5) - 0.5);

  float majorRings =
    1.0 - smoothstep(0.0, 0.030, majorRingCell);


  // ---------------------------------------------------------------------------
  // Radial grid lines
  // ---------------------------------------------------------------------------

  // 32 fine radial divisions
  float minorSpokeCell =
    abs(fract(
      (angle / 6.2831853) * 32.0 + 0.5
    ) - 0.5);

  float minorSpokes =
    1.0 - smoothstep(
      0.0,
      0.020 + radius * 0.008,
      minorSpokeCell
    );

  // 12 stronger radial divisions
  float majorSpokeCell =
    abs(fract(
      (angle / 6.2831853) * 12.0 + 0.5
    ) - 0.5);

  float majorSpokes =
    1.0 - smoothstep(
      0.0,
      0.024 + radius * 0.010,
      majorSpokeCell
    );


  // ---------------------------------------------------------------------------
  // Circular masks
  // ---------------------------------------------------------------------------

  // Keep the immediate core cleaner
  float innerMask =
    smoothstep(0.17, 0.27, radius);

  // Begin fading shortly after the main assembly.
  // The grid completely disappears at radius 0.94.
  float outerMask =
    1.0 - smoothstep(0.78, 0.80, radius);

  float fade =
    innerMask * outerMask;

  float minor =
    max(minorRings, minorSpokes)
    * fade;

  float major =
    max(majorRings, majorSpokes)
    * fade;


  // ---------------------------------------------------------------------------
  // Slow breathing
  // ---------------------------------------------------------------------------

  float breathing =
    0.82 + 0.18 * sin(t * 0.85);

  float centerBreathing =
    exp(-radius * 2.4)
    * (0.5 + 0.5 * sin(t * 1.15));

  breathing +=
    centerBreathing * 0.16;


  // ---------------------------------------------------------------------------
  // Main circular energy wave
  // ---------------------------------------------------------------------------

  // The wave now only travels to radius 0.96
  float wavePosition =
    fract(t * 0.115) * 0.96;

  float waveDistance =
    abs(radius - wavePosition);

  // Bright concentrated edge
  float waveCore =
    1.0 - smoothstep(
      0.0,
      0.022,
      waveDistance
    );

  // Wide surrounding glow
  float waveGlow =
    1.0 - smoothstep(
      0.0,
      0.155,
      waveDistance
    );

  // Fade the wave in near the core and out near the grid edge
  float waveLife =
    smoothstep(0.05, 0.18, wavePosition)
    * (
      1.0 -
      smoothstep(0.76, 0.94, wavePosition)
    );

  waveCore *= waveLife;
  waveGlow *= waveLife;


  // ---------------------------------------------------------------------------
  // Secondary circular energy wave
  // ---------------------------------------------------------------------------

  float secondWavePosition =
    fract(t * 0.115 + 0.52) * 0.96;

  float secondWaveDistance =
    abs(radius - secondWavePosition);

  float secondWave =
    1.0 - smoothstep(
      0.0,
      0.085,
      secondWaveDistance
    );

  float secondWaveLife =
    smoothstep(0.05, 0.18, secondWavePosition)
    * (
      1.0 -
      smoothstep(0.76, 0.94, secondWavePosition)
    );

  secondWave *= secondWaveLife;


  // ---------------------------------------------------------------------------
  // Final color
  // ---------------------------------------------------------------------------

  vec3 color =
    vec3(0.0);

  // Subtle circular grid
  color += HUD_CYAN_DARK
    * minor
    * 0.050
    * breathing;

  // Stronger major rings and spokes
  color += HUD_CYAN
    * major
    * 0.065
    * breathing;

  float completeGrid =
    max(minor, major);

  // Wide cyan energy glow
  color += HUD_CYAN
    * completeGrid
    * waveGlow
    * 0.46;

  // Bright concentrated wave edge
  color += HUD_CYAN_BRIGHT
    * completeGrid
    * waveCore
    * 0.95;

  // Cyan-white hot center
  color += vec3(0.45, 0.95, 1.0)
    * completeGrid
    * waveCore
    * waveCore
    * 0.42;

  // Weaker secondary wave
  color += HUD_CYAN
    * completeGrid
    * secondWave
    * 0.18;

  return color;
}