void main() {
  vec2 centered = (vUv - 0.5) * 2.0;
  centered.x *= uResolution.x / uResolution.y;
  vec2 hud = centered / max(uHudScale, 0.01);
  hud.y -= uCoreOffsetY;

  // Debug stages 14–20 map to the ordered network construction stages.
  int networkStage = uDebugLayer >= 14 ? uDebugLayer - 13 : 0;
  vec3 color = layerCoreNetworkStatic(hud, networkStage);
  if (uDebugLayer == 14 && !uTransparent) {
    color += backgroundLayer(vUv, centered);
  }

  vec3 outputColor = color * uIntensity;
  float outputAlpha = uTransparent
    ? clamp(max(max(outputColor.r, outputColor.g), outputColor.b), 0.0, 1.0)
    : 1.0;
  gl_FragColor = vec4(outputColor, outputAlpha);
}
