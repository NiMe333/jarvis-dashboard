void main() {
  vec2 centered = (vUv - 0.5) * 2.0;
  centered.x *= uResolution.x / uResolution.y;
  vec2 hud = centered / max(uHudScale, 0.01);
  float t = uFreezeTime ? 0.0 : uTime * uAnimationSpeed;
  vec3 color = vec3(0.0);

  if (uDebugLayer == 0 || uDebugLayer == 1) color += backgroundLayer(vUv, centered);
  if (uDebugLayer == 0 || uDebugLayer == 4) color += layerOuterRings(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 5) color += layerPanels(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 6) color += layerInnerRings(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 7) color += layerEnergy(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 8) color += layerCore(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 9) color += layerOrbits(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 10) color += layerParticles(hud, t);
  if (uDebugLayer == 0 || uDebugLayer == 11) color = layerPostEffects(color, hud, t);

  if (uDebugUV) color = vec3(vUv, 0.0);
  gl_FragColor = vec4(color * uIntensity, uTransparent ? 0.0 : 1.0);
}
