void main() {
  vec2 centered = (vUv - 0.5) * 2.0;
  centered.x *= uResolution.x / uResolution.y;
  vec2 hud = centered / max(uHudScale, 0.01);
  float t = uFreezeTime ? 0.0 : uTime * uAnimationSpeed;
  vec3 color = vec3(0.0);

  // INNER_CORE_ONLY (13) is the working comparison view for the approved core
  // plus the first cyan ring assembly. It intentionally skips post effects.
  if (uDebugLayer == 13) {
    color += backgroundLayer(vUv, centered);
    color += layerCore(hud, t);
    color += layerInnerRings(hud, t);
  // CORE_ONLY mode: debugLayer 8 renders background + central core.
  // GEOMETRY_ONLY (12) uses the same core function with its rings bypassed.
  } else if (uDebugLayer == 8 || uDebugLayer == 12) {
    color += backgroundLayer(vUv, centered);
    color += layerCore(hud, t);
  } else {
    if (uDebugLayer == 0 || uDebugLayer == 1) color += backgroundLayer(vUv, centered);
    if (uDebugLayer == 0 || uDebugLayer == 2) color += layerGrid(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 4) color += layerOuterRings(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 5) color += layerPanels(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 6) color += layerInnerRings(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 7) color += layerEnergy(hud, t);
    if (uDebugLayer == 10) color += layerParticles(hud, t);
    if (uDebugLayer == 0) {
      color += layerCore(hud, t);
      color += layerParticles(hud, t);
    }
    if (uDebugLayer == 0 || uDebugLayer == 11) color = layerPostEffects(color, hud, t);
  }

  // Shared reactor breathing: a soft radial wave travels from the core
  // outward, so every visible layer responds as one assembly.
  float radialDistance = length(hud);
  float radialBreath = 1.0 + 0.055 * sin(t * 0.78 - radialDistance * 5.6);
  color *= radialBreath;

  if (uDebugUV) color = vec3(vUv, 0.0);
  gl_FragColor = vec4(color * uIntensity, uTransparent ? 0.0 : 1.0);
}
