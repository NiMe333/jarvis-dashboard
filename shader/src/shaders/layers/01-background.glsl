// -----------------------------------------------------------------------------
// JARVIS HUD — Layer 01: Background settings
// -----------------------------------------------------------------------------
const vec3 BASE_COLOR = vec3(0.0009, 0.0050, 0.0070); // approximately #010A0E
const vec3 CENTER_TINT = vec3(0.0000, 0.0140, 0.0180);
const float CENTER_GLOW_STRENGTH = 0.020;
const float CENTER_GLOW_RADIUS = 0.78;
const float VIGNETTE_STRENGTH = 0.72;
const float GRAIN_STRENGTH = 0.0045;

float backgroundHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 backgroundLayer(vec2 uv, vec2 screenUv) {
  float radius = length(screenUv);
  float radial = 1.0 - smoothstep(0.0, CENTER_GLOW_RADIUS, radius);
  float broadCenter = radial * radial * 0.42;
  float vignette = smoothstep(0.52, 1.08, radius * radius);
  float vignetteMix = 1.0 - vignette * VIGNETTE_STRENGTH;

  vec3 color = BASE_COLOR;
  color += CENTER_TINT * broadCenter;
  color += CENTER_TINT * (radial * CENTER_GLOW_STRENGTH);
  color *= vignetteMix;

  float grain = (backgroundHash(floor(uv * 900.0) + floor(uTime * 0.08)) - 0.5) * GRAIN_STRENGTH;
  return max(color + grain, vec3(0.0));
}
