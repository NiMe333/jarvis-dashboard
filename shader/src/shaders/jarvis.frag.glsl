void main() {
  vec2 centered = (vUv - 0.5) * 2.0;
  centered.x *= uResolution.x / uResolution.y;
  vec2 hud = centered / max(uHudScale, 0.01);
  // Shared polar radius. Expensive layers are entered only where their glow or
  // geometry can contribute; every range includes a small safety margin.
  float radius = length(hud);
  float t = uFreezeTime ? 0.0 : uTime * uAnimationSpeed;
  vec3 color = vec3(0.0);

  // INNER_CORE_ONLY (13) is the working comparison view for the approved core
  // plus the first cyan ring assembly. It intentionally skips post effects.
  if (uDebugLayer == 13) {
    if (!uTransparent) color += backgroundLayer(vUv, centered);
    if (radius < 0.20) color += layerCore(hud, t);
    if (radius > 0.07 && radius < 0.36) color += layerInnerRings(hud, t);
  // CORE_ONLY mode: debugLayer 8 renders background + central core.
  // GEOMETRY_ONLY (12) uses the same core function with its rings bypassed.
  } else if (uDebugLayer == 8 || uDebugLayer == 12) {
    if (!uTransparent) color += backgroundLayer(vUv, centered);
    if (radius < 0.20) color += layerCore(hud, t);
  } else {
    if (!uTransparent && (uDebugLayer == 0 || uDebugLayer == 1)) color += backgroundLayer(vUv, centered);
    if ((uDebugLayer == 0 || uDebugLayer == 2) && radius > 0.15 && radius < 0.82) color += layerGrid(hud, t);
    if ((uDebugLayer == 0 || uDebugLayer == 4) && radius > 0.26 && radius < 0.87) color += layerOuterRings(hud, t);
    if ((uDebugLayer == 0 || uDebugLayer == 5) && radius > 0.42 && radius < 0.93) color += layerPanels(hud, t);
    if ((uDebugLayer == 0 || uDebugLayer == 6) && radius > 0.07 && radius < 0.36) color += layerInnerRings(hud, t);
    if ((uDebugLayer == 0 || uDebugLayer == 7) && radius > 0.31 && radius < 0.76) color += layerEnergy(hud, t);
    if (uDebugLayer == 10 && radius > 0.30 && radius < 0.85) color += layerParticles(hud, t);
    if (uDebugLayer == 0) {
      if (radius < 0.20) color += layerCore(hud, t);
      if (radius > 0.30 && radius < 0.85) color += layerParticles(hud, t);
    }
    if (uDebugLayer == 0 || uDebugLayer == 11) color = layerPostEffects(color, hud, t);
  }

  // Shared reactor breathing: a soft radial wave travels from the core
  // outward, so every visible layer responds as one assembly.
  float radialBreath = 1.0 + 0.055 * sin(t * 0.78 - radius * 5.6);
  color *= radialBreath;

  if (uDebugUV) color = vec3(vUv, 0.0);
  vec3 outputColor = color * uIntensity;
  float outputAlpha = uTransparent
    ? clamp(max(max(outputColor.r, outputColor.g), outputColor.b), 0.0, 1.0)
    : 1.0;
  gl_FragColor = vec4(outputColor, outputAlpha);
}
