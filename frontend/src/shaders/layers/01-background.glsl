// -----------------------------------------------------------------------------
// JARVIS HUD — Layer 01: Static technological background
// -----------------------------------------------------------------------------

const vec3 BASE_COLOR       = vec3(0.0009, 0.0050, 0.0070);
const vec3 CENTER_TINT      = vec3(0.0000, 0.0140, 0.0180);

const vec3 GRID_COLOR       = vec3(0.000, 0.135, 0.165);
const vec3 LINE_COLOR       = vec3(0.000, 0.310, 0.365);
const vec3 NODE_COLOR       = vec3(0.000, 0.620, 0.700);

const float CENTER_GLOW_STRENGTH = 0.020;
const float CENTER_GLOW_RADIUS   = 0.78;
const float VIGNETTE_STRENGTH    = 0.72;
const float GRAIN_STRENGTH       = 0.0025;


// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

float backgroundHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float lineMask(float value, float position, float width) {
  return 1.0 - smoothstep(width, width * 2.0, abs(value - position));
}

float segmentMask(float value, float start, float end, float feather) {
  return smoothstep(start, start + feather, value)
       * (1.0 - smoothstep(end - feather, end, value));
}

float circleMask(vec2 p, float radius, float feather) {
  return 1.0 - smoothstep(radius, radius + feather, length(p));
}


// -----------------------------------------------------------------------------
// Fine blueprint grid
// -----------------------------------------------------------------------------

float technicalGrid(vec2 uv) {
  vec2 gridUv = uv * vec2(72.0, 40.0);
  vec2 cell = abs(fract(gridUv) - 0.5);

  float vertical   = 1.0 - smoothstep(0.485, 0.5, cell.x);
  float horizontal = 1.0 - smoothstep(0.485, 0.5, cell.y);

  float fineGrid = max(vertical, horizontal);

  vec2 majorUv = uv * vec2(18.0, 10.0);
  vec2 majorCell = abs(fract(majorUv) - 0.5);

  float majorVertical =
    1.0 - smoothstep(0.475, 0.5, majorCell.x);

  float majorHorizontal =
    1.0 - smoothstep(0.475, 0.5, majorCell.y);

  float majorGrid = max(majorVertical, majorHorizontal);

  return fineGrid * 0.13 + majorGrid * 0.22;
}


// -----------------------------------------------------------------------------
// Static circuit/HUD traces
// -----------------------------------------------------------------------------

float circuitLines(vec2 uv) {
  float lines = 0.0;

  // Long horizontal traces
  lines += lineMask(uv.y, 0.105, 0.0007)
         * segmentMask(uv.x, 0.04, 0.35, 0.012);

  lines += lineMask(uv.y, 0.105, 0.0007)
         * segmentMask(uv.x, 0.66, 0.96, 0.012);

  lines += lineMask(uv.y, 0.212, 0.00055)
         * segmentMask(uv.x, 0.10, 0.28, 0.010);

  lines += lineMask(uv.y, 0.212, 0.00055)
         * segmentMask(uv.x, 0.72, 0.90, 0.010);

  lines += lineMask(uv.y, 0.792, 0.00055)
         * segmentMask(uv.x, 0.08, 0.31, 0.010);

  lines += lineMask(uv.y, 0.792, 0.00055)
         * segmentMask(uv.x, 0.69, 0.93, 0.010);

  lines += lineMask(uv.y, 0.905, 0.0007)
         * segmentMask(uv.x, 0.04, 0.39, 0.012);

  lines += lineMask(uv.y, 0.905, 0.0007)
         * segmentMask(uv.x, 0.61, 0.96, 0.012);

  // Short fragmented data lines
  lines += lineMask(uv.y, 0.325, 0.0005)
         * segmentMask(uv.x, 0.025, 0.145, 0.007);

  lines += lineMask(uv.y, 0.355, 0.0005)
         * segmentMask(uv.x, 0.055, 0.205, 0.007);

  lines += lineMask(uv.y, 0.640, 0.0005)
         * segmentMask(uv.x, 0.795, 0.955, 0.007);

  lines += lineMask(uv.y, 0.675, 0.0005)
         * segmentMask(uv.x, 0.845, 0.975, 0.007);

  // Vertical structural traces
  lines += lineMask(uv.x, 0.085, 0.00055)
         * segmentMask(uv.y, 0.18, 0.43, 0.010);

  lines += lineMask(uv.x, 0.915, 0.00055)
         * segmentMask(uv.y, 0.56, 0.82, 0.010);

  lines += lineMask(uv.x, 0.245, 0.00045)
         * segmentMask(uv.y, 0.07, 0.19, 0.008);

  lines += lineMask(uv.x, 0.755, 0.00045)
         * segmentMask(uv.y, 0.81, 0.93, 0.008);

  return lines;
}


// -----------------------------------------------------------------------------
// Diagonal circuit connectors
// -----------------------------------------------------------------------------

float diagonalCircuits(vec2 uv) {
  float lines = 0.0;

  // Top-left angled connector
  float diagonalA = abs(
    uv.y - (0.285 - (uv.x - 0.13) * 0.62)
  );

  lines += (1.0 - smoothstep(0.0008, 0.0022, diagonalA))
         * segmentMask(uv.x, 0.13, 0.225, 0.008);

  // Top-right angled connector
  float diagonalB = abs(
    uv.y - (0.225 + (uv.x - 0.775) * 0.62)
  );

  lines += (1.0 - smoothstep(0.0008, 0.0022, diagonalB))
         * segmentMask(uv.x, 0.775, 0.87, 0.008);

  // Bottom-left connector
  float diagonalC = abs(
    uv.y - (0.715 + (uv.x - 0.13) * 0.62)
  );

  lines += (1.0 - smoothstep(0.0008, 0.0022, diagonalC))
         * segmentMask(uv.x, 0.13, 0.225, 0.008);

  // Bottom-right connector
  float diagonalD = abs(
    uv.y - (0.775 - (uv.x - 0.775) * 0.62)
  );

  lines += (1.0 - smoothstep(0.0008, 0.0022, diagonalD))
         * segmentMask(uv.x, 0.775, 0.87, 0.008);

  return lines;
}


// -----------------------------------------------------------------------------
// Small static data marks
// -----------------------------------------------------------------------------

float dataMarks(vec2 uv) {
  vec2 cells = vec2(52.0, 30.0);
  vec2 cellId = floor(uv * cells);
  vec2 cellUv = fract(uv * cells) - 0.5;

  float random = backgroundHash(cellId);
  float enabled = step(0.935, random);

  float dash =
    (1.0 - smoothstep(0.025, 0.065, abs(cellUv.y)))
    * (1.0 - smoothstep(0.16, 0.38, abs(cellUv.x)));

  // Keep center cleaner for the JARVIS core
  float centerProtection =
    smoothstep(0.18, 0.48, length(uv - 0.5));

  return dash * enabled * centerProtection;
}


// -----------------------------------------------------------------------------
// Static connection nodes
// -----------------------------------------------------------------------------

float connectionNodes(vec2 uv) {
  float nodes = 0.0;

  nodes += circleMask(uv - vec2(0.145, 0.105), 0.0022, 0.0012);
  nodes += circleMask(uv - vec2(0.350, 0.105), 0.0022, 0.0012);
  nodes += circleMask(uv - vec2(0.660, 0.105), 0.0022, 0.0012);
  nodes += circleMask(uv - vec2(0.855, 0.105), 0.0022, 0.0012);

  nodes += circleMask(uv - vec2(0.085, 0.325), 0.0019, 0.0011);
  nodes += circleMask(uv - vec2(0.915, 0.675), 0.0019, 0.0011);

  nodes += circleMask(uv - vec2(0.225, 0.226), 0.0020, 0.0012);
  nodes += circleMask(uv - vec2(0.775, 0.226), 0.0020, 0.0012);
  nodes += circleMask(uv - vec2(0.225, 0.774), 0.0020, 0.0012);
  nodes += circleMask(uv - vec2(0.775, 0.774), 0.0020, 0.0012);

  return nodes;
}


// -----------------------------------------------------------------------------
// Final background
// -----------------------------------------------------------------------------

vec3 backgroundLayer(vec2 uv, vec2 screenUv) {
  float radius = length(screenUv);

  float radial =
    1.0 - smoothstep(0.0, CENTER_GLOW_RADIUS, radius);

  float broadCenter = radial * radial * 0.42;

  float vignette =
    smoothstep(0.52, 1.08, radius * radius);

  float vignetteMix =
    1.0 - vignette * VIGNETTE_STRENGTH;

  vec3 color = BASE_COLOR;

  // Original central illumination
  color += CENTER_TINT * broadCenter;
  color += CENTER_TINT * radial * CENTER_GLOW_STRENGTH;

  // Lightweight ambient depth beneath the grid: two cheap radial falloffs
  // create a soft halo around the reactor without adding geometry or loops.
  float reactorHalo = exp(-pow((radius - 0.68) / 0.16, 2.0));
  float outerHaze = exp(-pow((radius - 0.92) / 0.30, 2.0));
  color += vec3(0.0000, 0.0100, 0.0140) * reactorHalo;
  color += vec3(0.0000, 0.0040, 0.0070) * outerHaze;

  // Darker technology field toward the edges
  float technologyVisibility =
    0.40 + smoothstep(0.12, 0.82, radius) * 0.60;

  float grid = technicalGrid(uv);
  float circuits = circuitLines(uv);
  float diagonals = diagonalCircuits(uv);
  float marks = dataMarks(uv);
  float nodes = connectionNodes(uv);

  color += GRID_COLOR * grid * technologyVisibility;
  color += LINE_COLOR * circuits * 0.72;
  color += LINE_COLOR * diagonals * 0.48;
  color += LINE_COLOR * marks * 0.32;
  color += NODE_COLOR * nodes * 0.75;

  // Very subtle static texture — no uTime
  float grain =
    (backgroundHash(floor(uv * 1100.0)) - 0.5)
    * GRAIN_STRENGTH;

  color += grain;
  color *= vignetteMix;

  // Keep the technical field mostly outside the reactor silhouette. A small
  // residual tint inside prevents a completely dead cutout while the rings
  // and core remain the visual focus.
  float aroundCircle = smoothstep(0.44, 0.72, radius);
  color *= mix(0.16, 1.0, aroundCircle);

  // Keep the technical field present, but clearly behind the reactor layers.
  return max(color * 0.70, vec3(0.0));
}
