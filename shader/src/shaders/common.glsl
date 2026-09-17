precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uPixelRatio;
uniform float uIntensity;
uniform float uAnimationSpeed;
uniform float uHudScale;
uniform float uGlowIntensity;
uniform bool uTransparent;
uniform int uDebugLayer;
uniform bool uFreezeTime;
uniform bool uDebugUV;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float AA = 0.0024;
const vec3 HUD_CYAN = vec3(0.0, 0.875, 0.965);
const vec3 HUD_CYAN_DARK = vec3(0.0, 0.230, 0.275);
const vec3 HUD_CYAN_BRIGHT = vec3(0.486, 0.969, 1.0);
const vec3 HUD_ORANGE = vec3(1.0, 0.588, 0.239);
const vec3 HUD_ORANGE_BRIGHT = vec3(1.0, 0.816, 0.604);

vec2 rotate2d(vec2 p, float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat2(c, -s, s, c) * p;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash11(float p) { return fract(sin(p * 91.17) * 43758.5453); }

float lineMask(float distanceToLine, float width) {
  return 1.0 - smoothstep(width, width + AA, distanceToLine);
}

float ringMask(vec2 p, float radius, float width) {
  return lineMask(abs(length(p) - radius), width);
}

float softRing(vec2 p, float radius, float width) {
  return 1.0 - smoothstep(width, width + AA * 2.0, abs(length(p) - radius));
}

float arcMask(vec2 p, float radius, float width, float centerAngle, float span) {
  float angle = atan(p.y, p.x);
  float delta = abs(atan(sin(angle - centerAngle), cos(angle - centerAngle)));
  float angularEdge = max(AA / max(radius, 0.1), 0.003);
  float arc = 1.0 - smoothstep(span * 0.5, span * 0.5 + angularEdge, delta);
  return arc * lineMask(abs(length(p) - radius), width);
}

float arcGlow(vec2 p, float radius, float width, float centerAngle, float span) {
  float angle = atan(p.y, p.x);
  float delta = abs(atan(sin(angle - centerAngle), cos(angle - centerAngle)));
  float angularEdge = max(AA / max(radius, 0.1), 0.004);
  float arc = 1.0 - smoothstep(span * 0.5, span * 0.5 + angularEdge * 4.0, delta);
  float radial = exp(-pow(abs(length(p) - radius) / max(width * 5.0, 0.012), 2.0));
  return arc * radial;
}

float tickRing(vec2 p, float radius, float count, float tickWidth, float tickLength) {
  float r = length(p);
  float angle = atan(p.y, p.x);
  float cell = fract((angle + PI) / TAU * count);
  float tick = 1.0 - smoothstep(0.08, 0.20, abs(cell - 0.5));
  float radial = 1.0 - smoothstep(tickWidth, tickWidth + AA, abs(r - (radius + tickLength * 0.5)));
  return tick * radial;
}

float radialDash(vec2 p, float radius, float count, float dashWidth, float dashLength, float phase) {
  float r = length(p);
  float angle = atan(p.y, p.x);
  float cell = fract((angle + phase) / TAU * count);
  float dash = 1.0 - smoothstep(dashWidth, dashWidth + 0.045, abs(cell - 0.5));
  float radial = 1.0 - smoothstep(dashLength, dashLength + AA, abs(r - radius));
  return dash * radial;
}

float capsule(vec2 p, vec2 a, vec2 b, float radius) {
  vec2 pa = p - a; vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return lineMask(length(pa - ba * h), radius);
}

float orbitalEllipse(vec2 p, float radius, float flatten, float angle, float width) {
  vec2 q = rotate2d(p, angle);
  float ellipse = length(q / vec2(radius, radius * flatten));
  return lineMask(abs(ellipse - 1.0) * radius, width);
}

float orbitalGlow(vec2 p, float radius, float flatten, float angle) {
  vec2 q = rotate2d(p, angle);
  float ellipse = length(q / vec2(radius, radius * flatten));
  return exp(-pow(abs(ellipse - 1.0) * radius / 0.018, 2.0));
}

vec3 addGlow(vec3 color, vec3 tint, float sharp, float glow, float strength) {
  return color + tint * (sharp + glow * uGlowIntensity) * strength;
}

float pointMask(vec2 p, vec2 center, float radius) {
  return 1.0 - smoothstep(radius, radius + AA * 2.0, length(p - center));
}

float polygonEdge(vec2 p, float radius, float sides, float rotation, float width) {
  float a = atan(p.y, p.x) + rotation;
  float sector = TAU / sides;
  float local = abs(mod(a + sector * 0.5, sector) - sector * 0.5);
  float edge = cos(local) * length(p) - radius * cos(sector * 0.5);
  return lineMask(abs(edge), width);
}
