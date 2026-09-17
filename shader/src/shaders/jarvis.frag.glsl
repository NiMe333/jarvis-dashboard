void main() {
  vec2 centered = (vUv - 0.5) * 2.0;
  centered.x *= uResolution.x / uResolution.y;
  vec2 hud = centered / max(uHudScale, 0.01);
  float t = uFreezeTime ? 0.0 : uTime * uAnimationSpeed;
  vec3 color = vec3(0.0);

  // Temporary CORE_ONLY mode: debugLayer 8 renders background + central core.
  // GEOMETRY_ONLY (12) uses the same core function with its rings bypassed.
  if (uDebugLayer == 8 || uDebugLayer == 12) {
    color += backgroundLayer(vUv, centered);
    color += layerCore(hud, t);
  } else {
    if (uDebugLayer == 0 || uDebugLayer == 1) color += backgroundLayer(vUv, centered);
    if (uDebugLayer == 0 || uDebugLayer == 4) color += layerOuterRings(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 5) color += layerPanels(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 6) color += layerInnerRings(hud, t);
    if (uDebugLayer == 0 || uDebugLayer == 7) color += layerEnergy(hud, t);
    if (uDebugLayer == 9) color += layerOrbits(hud, t);
    if (uDebugLayer == 10) color += layerParticles(hud, t);
    if (uDebugLayer == 0) {
      color += layerCore(hud, t);
      color += layerOrbits(hud, t);
      color += layerParticles(hud, t);
    }
    if (uDebugLayer == 0 || uDebugLayer == 11) color = layerPostEffects(color, hud, t);
  }

  if (uDebugUV) color = vec3(vUv, 0.0);
  gl_FragColor = vec4(color * uIntensity, uTransparent ? 0.0 : 1.0);
}
