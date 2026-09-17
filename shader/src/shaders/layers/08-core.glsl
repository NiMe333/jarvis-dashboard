// -----------------------------------------------------------------------------
// JARVIS HUD — Layer 08: central reactor core
// CORE_SCALE is measured in the aspect-correct HUD coordinate space. With the
// current HUD radius (~0.86), 0.21 gives an outer core radius near 23% of HUD.
// -----------------------------------------------------------------------------
const float CORE_SCALE = 0.21;
const float CORE_GLOW = 1.10;
const float CORE_SPEED = 0.16;
const float CORE_DETAIL = 1.0;
const float CORE_ROTATION_SPEED = 0.10;

const vec3 CORE_WHITE_HOT = vec3(1.00, 0.98, 0.90);
const vec3 CORE_WHITE_WARM = vec3(1.00, 0.88, 0.70);
const vec3 CORE_ORANGE_LIGHT = vec3(1.00, 0.67, 0.30);
const vec3 CORE_ORANGE = vec3(1.00, 0.43, 0.10);
const vec3 CORE_ORANGE_DARK = vec3(0.45, 0.14, 0.025);
const vec3 CORE_GLOW_WARM = vec3(1.00, 0.52, 0.16);

// Reuse the existing layer expressions below while applying the new palette
// only to this core source block. Undefine them at the end so later layers are
// not affected by these aliases.
#define HUD_CYAN_DARK CORE_ORANGE_DARK
#define HUD_CYAN CORE_ORANGE_LIGHT
#define HUD_CYAN_BRIGHT CORE_WHITE_WARM

float coreSegmentDistance(vec2 p, vec2 a, vec2 b, out float along) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  along = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * along);
}

float coreSegment(vec2 p, vec2 a, vec2 b, float width) {
  float along;
  return lineMask(coreSegmentDistance(p, a, b, along), width);
}

float coreSegmentGlow(vec2 p, vec2 a, vec2 b, float width) {
  float along;
  float distanceToSegment = coreSegmentDistance(p, a, b, along);
  return exp(-pow(distanceToSegment / max(width * 14.0, 0.018), 2.0));
}

vec3 coreEdge(vec2 p, vec2 a, vec2 b, float width, vec3 tint, float strength) {
  float sharp = coreSegment(p, a, b, width);
  float halo = coreSegmentGlow(p, a, b, width) * CORE_GLOW;
  return tint * sharp * strength + CORE_GLOW_WARM * halo * strength * 0.11;
}

// Exactly fourteen silhouette vertices. Their angular spacing is fixed and the
// radius is fixed as well, so the outer shape never turns into a star or flower.
vec2 coreOuterVertex(int index) {
  float angle = PI * 0.5 + float(index) * TAU / 14.0;
  return vec2(cos(angle), sin(angle)) * 0.47;
}

// A second, offset latitude ring gives the wireframe a spherical projection.
// Its small static depth modulation creates front/back tonal variation without
// individually pulsing the fourteen outer vertices.
vec2 coreMiddleVertex(int index, float t) {
  float angle = PI * 0.5 + (float(index) + 0.5) * TAU / 14.0;
  float depth = 0.325;
  vec2 vertex = vec2(cos(angle), sin(angle)) * depth;
  return vertex;
}

// Eight irregular inner vertices avoid the old obvious seven-sided ring. They
// form a small faceted cap, with no single hub connected to all outer points.
vec2 coreInnerVertex(int index, float t) {
  float angle = PI * 0.5 + float(index) * TAU / 8.0;
  float radius = 0.165;
  return vec2(cos(angle), sin(angle)) * radius;
}

float triangleCell(vec2 p, vec2 a, vec2 b, vec2 c) {
  float ab = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  float bc = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
  float ca = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
  float positive = step(0.0, ab) * step(0.0, bc) * step(0.0, ca);
  float negative = step(ab, 0.0) * step(bc, 0.0) * step(ca, 0.0);
  return max(positive, negative);
}

vec3 layerCore(vec2 p, float t) {
  vec2 q = p / CORE_SCALE;
  float time = t * CORE_SPEED;
  float breathe = 0.94 + 0.06 * sin(time * 5.0);
  float spinSlow = time * 0.42;
  float spinFast = -time * 0.76;
  vec3 color = vec3(0.0);

  // Dark reactor well behind the geometry. It gives the center depth without
  // turning the whole core into a flat cyan disk.
  float well = 1.0 - smoothstep(0.0, 0.74, length(q));
  color += HUD_CYAN_DARK * well * 0.075;
  color += HUD_CYAN * exp(-pow(length(q) / 0.66, 2.0)) * 0.018 * CORE_GLOW;
  float reactorAmbient = exp(-pow(length(q) / 0.72, 2.0)) * 0.020 * CORE_GLOW;
  color += CORE_GLOW_WARM * reactorAmbient;

  if (uDebugLayer != 12) {
    // Uneven protection rings: varied radii, widths and contrast are intentional.
    color += HUD_CYAN_DARK * ringMask(q, 0.39, 0.018) * 0.42;
    color += HUD_CYAN * ringMask(q, 0.45, 0.009) * 0.90;
    color += HUD_CYAN_BRIGHT * ringMask(q, 0.53, 0.013) * 0.80 * breathe;
    color += HUD_CYAN_DARK * ringMask(q, 0.61, 0.025) * 0.36;
    color += HUD_CYAN * ringMask(q, 0.68, 0.006) * 0.52;
    color += HUD_CYAN_DARK * ringMask(q, 0.75, 0.012) * 0.58;
    color += HUD_CYAN * ringMask(q, 0.84, 0.004) * 0.78;
    color += HUD_CYAN_DARK * ringMask(q, 0.93, 0.016) * 0.62;

    // Distinct mid-width halo layers, kept separate from sharp line work.
    color += HUD_CYAN * softRing(q, 0.53, 0.030) * 0.045 * CORE_GLOW;
    color += HUD_CYAN_BRIGHT * softRing(q, 0.84, 0.024) * 0.030 * CORE_GLOW;
    color += HUD_CYAN_DARK * softRing(q, 0.68, 0.045) * 0.055 * CORE_GLOW;

    // Counter-rotating segmented rings and their small radial ticks.
    color += HUD_CYAN_BRIGHT * arcMask(q, 0.53, 0.012, 0.32 + spinFast, 0.74) * 0.90;
    color += HUD_CYAN * arcMask(q, 0.53, 0.008, 3.64 + spinFast, 0.48) * 0.84;
    color += HUD_CYAN * arcMask(q, 0.68, 0.010, 1.82 + spinSlow, 0.68) * 0.72;
    color += HUD_CYAN_BRIGHT * arcMask(q, 0.68, 0.006, 4.76 + spinSlow, 0.32) * 0.78;
    color += HUD_CYAN * arcMask(q, 0.84, 0.007, 2.50 - spinSlow, 0.54) * 0.76;
    color += HUD_CYAN_BRIGHT * tickRing(q, 0.745, 48.0, 0.010, 0.030) * 0.66;
    color += HUD_CYAN * tickRing(q, 0.600, 36.0, 0.008, 0.022) * 0.60;
    color += HUD_CYAN_DARK * radialDash(q, 0.875, 32.0, 0.22, 0.008, spinFast) * 0.72;

    // A few short radial bridges create the tunnel-like depth between ring levels.
    for (int i = 0; i < 6; i++) {
      float a = float(i) * TAU / 6.0 + spinSlow;
      vec2 dir = vec2(cos(a), sin(a));
      color += HUD_CYAN * capsule(q, dir * 0.54, dir * 0.72, 0.005) * 0.25;
    }
  }

  // ---------------------------------------------------------------------------
  // Structured geodesic-style wireframe geometry.
  // ---------------------------------------------------------------------------
  float coreRotation = -uTime * CORE_ROTATION_SPEED;
  q = rotate2d(q, coreRotation);

  vec2 v0 = coreOuterVertex(0);  vec2 v1 = coreOuterVertex(1);
  vec2 v2 = coreOuterVertex(2);  vec2 v3 = coreOuterVertex(3);
  vec2 v4 = coreOuterVertex(4);  vec2 v5 = coreOuterVertex(5);
  vec2 v6 = coreOuterVertex(6);  vec2 v7 = coreOuterVertex(7);
  vec2 v8 = coreOuterVertex(8);  vec2 v9 = coreOuterVertex(9);
  vec2 v10 = coreOuterVertex(10); vec2 v11 = coreOuterVertex(11);
  vec2 v12 = coreOuterVertex(12); vec2 v13 = coreOuterVertex(13);

  vec2 m0 = coreMiddleVertex(0, time);  vec2 m1 = coreMiddleVertex(1, time);
  vec2 m2 = coreMiddleVertex(2, time);  vec2 m3 = coreMiddleVertex(3, time);
  vec2 m4 = coreMiddleVertex(4, time);  vec2 m5 = coreMiddleVertex(5, time);
  vec2 m6 = coreMiddleVertex(6, time);  vec2 m7 = coreMiddleVertex(7, time);
  vec2 m8 = coreMiddleVertex(8, time);  vec2 m9 = coreMiddleVertex(9, time);
  vec2 m10 = coreMiddleVertex(10, time); vec2 m11 = coreMiddleVertex(11, time);
  vec2 m12 = coreMiddleVertex(12, time); vec2 m13 = coreMiddleVertex(13, time);

  vec2 i0 = coreInnerVertex(0, time); vec2 i1 = coreInnerVertex(1, time);
  vec2 i2 = coreInnerVertex(2, time); vec2 i3 = coreInnerVertex(3, time);
  vec2 i4 = coreInnerVertex(4, time); vec2 i5 = coreInnerVertex(5, time);
  vec2 i6 = coreInnerVertex(6, time); vec2 i7 = coreInnerVertex(7, time);

  // Light triangular cells in the two latitude bands. Alternating diagonals
  // keep the topology local and prevent the old star/web appearance.
  for (int k = 0; k < 14; k++) {
    int next = k + 1;
    if (next == 14) next = 0;
    vec2 outerA = coreOuterVertex(k);
    vec2 outerB = coreOuterVertex(next);
    vec2 middleA = coreMiddleVertex(k, time);
    vec2 middleB = coreMiddleVertex(next, time);
    if (mod(float(k), 2.0) < 0.5) {
      color += HUD_CYAN_DARK * triangleCell(q, outerA, outerB, middleA) * 0.020;
      color += HUD_CYAN_DARK * triangleCell(q, outerB, middleB, middleA) * 0.016;
      color += coreEdge(q, outerA, middleA, 0.006, HUD_CYAN, 0.62);
      color += coreEdge(q, outerB, middleA, 0.005, HUD_CYAN_BRIGHT, 0.74);
      color += coreEdge(q, outerB, middleB, 0.006, HUD_CYAN, 0.58);
    } else {
      color += HUD_CYAN_DARK * triangleCell(q, outerA, outerB, middleB) * 0.018;
      color += HUD_CYAN_DARK * triangleCell(q, outerA, middleB, middleA) * 0.015;
      color += coreEdge(q, outerA, middleA, 0.006, HUD_CYAN_BRIGHT, 0.72);
      color += coreEdge(q, outerA, middleB, 0.005, HUD_CYAN, 0.60);
      color += coreEdge(q, outerB, middleB, 0.006, HUD_CYAN_BRIGHT, 0.70);
    }
    color += coreEdge(q, middleA, middleB, 0.006, HUD_CYAN_DARK, 0.56);
  }

  // The sole outer silhouette: exactly fourteen edges, slightly stronger than
  // every interior connection.
  for (int k = 0; k < 14; k++) {
    int next = k + 1;
    if (next == 14) next = 0;
    vec3 edgeTint = mod(float(k), 2.0) < 0.5 ? HUD_CYAN : HUD_CYAN_BRIGHT;
    color += coreEdge(q, coreOuterVertex(k), coreOuterVertex(next), 0.014, edgeTint, 0.94);
  }

  // Local second-neighbour links add cells only inside the latitude band; they
  // never jump across the object or converge on a central hub.
  for (int k = 0; k < 14; k++) {
    int next2 = k + 2;
    if (next2 >= 14) next2 -= 14;
    vec3 tint = mod(float(k), 2.0) < 0.5 ? HUD_CYAN_BRIGHT : HUD_CYAN_DARK;
    color += coreEdge(q, coreOuterVertex(k), coreMiddleVertex(next2, time), 0.0045, tint, 0.48);
  }

  // Eight irregular inner vertices and their local attachments to the middle
  // latitude close the mesh into smaller triangular cells.
  color += coreEdge(q, i0, i1, 0.008, HUD_CYAN_BRIGHT, 0.80);
  color += coreEdge(q, i1, i2, 0.007, HUD_CYAN, 0.68);
  color += coreEdge(q, i2, i3, 0.008, HUD_CYAN_BRIGHT, 0.78);
  color += coreEdge(q, i3, i4, 0.007, HUD_CYAN, 0.68);
  color += coreEdge(q, i4, i5, 0.008, HUD_CYAN_BRIGHT, 0.80);
  color += coreEdge(q, i5, i6, 0.007, HUD_CYAN, 0.68);
  color += coreEdge(q, i6, i7, 0.008, HUD_CYAN_BRIGHT, 0.78);
  color += coreEdge(q, i7, i0, 0.007, HUD_CYAN, 0.68);
  color += coreEdge(q, i0, i2, 0.0045, HUD_CYAN_DARK, 0.54);
  color += coreEdge(q, i2, i4, 0.0045, HUD_CYAN, 0.48);
  color += coreEdge(q, i4, i6, 0.0045, HUD_CYAN_DARK, 0.54);
  color += coreEdge(q, i6, i0, 0.0045, HUD_CYAN, 0.48);
  color += coreEdge(q, i1, i3, 0.0045, HUD_CYAN_DARK, 0.50);
  color += coreEdge(q, i3, i5, 0.0045, HUD_CYAN, 0.46);
  color += coreEdge(q, i5, i7, 0.0045, HUD_CYAN_DARK, 0.50);
  color += coreEdge(q, i7, i1, 0.0045, HUD_CYAN, 0.46);

  // Cross the inner square instead of drawing a separate center dot. The two
  // structured diagonals create the central luminous intersection naturally.
  color += coreEdge(q, i0, i4, 0.006, HUD_CYAN_BRIGHT, 0.74);
  color += coreEdge(q, i2, i6, 0.005, HUD_CYAN, 0.68);
  color += coreEdge(q, i1, i5, 0.0045, HUD_CYAN_BRIGHT, 0.62);
  color += coreEdge(q, i3, i7, 0.0045, HUD_CYAN, 0.58);

  color += coreEdge(q, i0, m13, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i0, m0, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i1, m1, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i1, m2, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i2, m3, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i2, m4, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i3, m5, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i3, m6, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i4, m7, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i4, m8, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i5, m9, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i5, m10, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i6, m11, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i6, m12, 0.005, HUD_CYAN, 0.54);
  color += coreEdge(q, i7, m13, 0.005, HUD_CYAN_BRIGHT, 0.68);
  color += coreEdge(q, i7, m0, 0.005, HUD_CYAN, 0.54);

  // Temperature hierarchy at the existing line intersection. This uses the
  // crossing geometry itself, so no vertex, dot size, or topology is added.
  float centerCrossA = coreSegment(q, i0, i4, 0.006) * coreSegment(q, i2, i6, 0.005);
  float centerCrossB = coreSegment(q, i1, i5, 0.0045) * coreSegment(q, i3, i7, 0.0045);
  float centerSharp = max(centerCrossA, centerCrossB);
  float centerHalo = exp(-pow(length(q) / 0.045, 2.0));
  float centerAmbient = exp(-pow(length(q) / 0.115, 2.0));
  float temperaturePulse = 0.965 + 0.035 * sin(uTime * 3.20);
  color += CORE_WHITE_HOT * centerSharp * 1.15 * temperaturePulse;
  color += CORE_WHITE_WARM * centerHalo * 0.16 * temperaturePulse;
  color += CORE_GLOW_WARM * centerAmbient * 0.040 * CORE_GLOW;

  // Selected nodes are bright; the rest of the mesh stays thin and legible.
  color += HUD_CYAN_BRIGHT * pointMask(q, coreOuterVertex(0), 0.020) * 0.90;
  color += HUD_CYAN_BRIGHT * pointMask(q, coreOuterVertex(4), 0.020) * 0.82;
  color += HUD_CYAN_BRIGHT * pointMask(q, coreOuterVertex(7), 0.020) * 0.90;
  color += HUD_CYAN_BRIGHT * pointMask(q, coreOuterVertex(11), 0.020) * 0.82;
  color += HUD_CYAN * pointMask(q, coreOuterVertex(2), 0.013) * 0.60;
  color += HUD_CYAN * pointMask(q, coreOuterVertex(6), 0.013) * 0.60;
  color += HUD_CYAN * pointMask(q, coreOuterVertex(9), 0.013) * 0.60;
  color += HUD_CYAN * pointMask(q, coreOuterVertex(13), 0.013) * 0.60;
  color += HUD_CYAN_BRIGHT * pointMask(q, i0, 0.014) * 0.72;
  color += HUD_CYAN_BRIGHT * pointMask(q, i4, 0.014) * 0.72;

  // Restore the unrotated space before the two tiny orange core accents.
  q = rotate2d(q, -coreRotation);

  if (uDebugLayer != 12) {
    // Three tiny orange accents only: cyan remains the dominant core color.
    color += HUD_ORANGE_BRIGHT * arcMask(q, 0.68, 0.010, 0.48 - spinSlow, 0.075) * 0.82;
    color += HUD_ORANGE * arcMask(q, 0.84, 0.008, 3.26 + spinSlow, 0.060) * 0.74;
    color += HUD_ORANGE_BRIGHT * pointMask(q, vec2(cos(5.24), sin(5.24)) * 0.84, 0.010) * 0.72;
  }

  return color * CORE_DETAIL * breathe;
}

#undef HUD_CYAN_DARK
#undef HUD_CYAN
#undef HUD_CYAN_BRIGHT
