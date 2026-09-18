import * as THREE from "three";
import "./style.css";
import vertexShader from "./shaders/fullscreen.vert.glsl?raw";
import fragmentShader from "./shaders/jarvis.frag.glsl?raw";
import common from "./shaders/common.glsl?raw";
import background from "./shaders/layers/01-background.glsl?raw";
import grid from "./shaders/layers/02-grid.glsl?raw";
import outerRings from "./shaders/layers/04-outer-rings.glsl?raw";
import panels from "./shaders/layers/05-panels.glsl?raw";
import innerRings from "./shaders/layers/06-inner-rings.glsl?raw";
import energy from "./shaders/layers/07-energy.glsl?raw";
import core from "./shaders/layers/08-core.glsl?raw";
import particles from "./shaders/layers/10-particles.glsl?raw";
import postEffects from "./shaders/layers/11-post-effects.glsl?raw";

export const jarvisConfig = {
  transparent: false,
  showFps: true,
  // Fixed drawing-buffer size, independent of the window and screen DPR.
  renderWidth: 1148,
  renderHeight: 893,
  intensity: 1,
  animationSpeed: 1.65,
  hudScale: 1.0,
  glowIntensity: 0.82,
  // Working inner-ring preview: 13 = background + core + layer 06 only.
  debugLayer: 0,
  freezeTime: false,
  debugUV: false,
  cyan: "#00E5FF",
  orange: "#FF9A3D",
};
const panel = document.querySelector("#jarvis-core-panel");
panel.style.width = `min(${jarvisConfig.renderWidth}px, 100%)`;
panel.style.aspectRatio = `${jarvisConfig.renderWidth} / ${jarvisConfig.renderHeight}`;
const canvas = document.querySelector("#shader-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: jarvisConfig.transparent,
  powerPreference: "high-performance",
});
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const performanceHud = document.createElement("output");
performanceHud.id = "performance-hud";
performanceHud.hidden = !jarvisConfig.showFps;
panel.append(performanceHud);
const uniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uMouse: { value: new THREE.Vector2() },
  uPixelRatio: { value: 1 },
  uIntensity: { value: jarvisConfig.intensity },
  uAnimationSpeed: { value: jarvisConfig.animationSpeed },
  uHudScale: { value: jarvisConfig.hudScale },
  uGlowIntensity: { value: jarvisConfig.glowIntensity },
  uTransparent: { value: jarvisConfig.transparent },
  uDebugLayer: { value: jarvisConfig.debugLayer },
  uFreezeTime: { value: jarvisConfig.freezeTime },
  uDebugUV: { value: jarvisConfig.debugUV },
};
const source = [
  common,
  background,
  grid,
  outerRings,
  panels,
  innerRings,
  energy,
  core,
  particles,
  postEffects,
  fragmentShader,
].join("\n");
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: source,
  uniforms,
  transparent: jarvisConfig.transparent,
  depthTest: false,
  depthWrite: false,
});
// A rectangle fills only the bounded panel canvas.
const fullscreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(fullscreenMesh);
renderer.setPixelRatio(1);
renderer.setSize(jarvisConfig.renderWidth, jarvisConfig.renderHeight, false);
uniforms.uResolution.value.set(jarvisConfig.renderWidth, jarvisConfig.renderHeight);
const resizeObserver = new ResizeObserver(() => resize());
const resize = () => {
  const width = Math.max(panel.clientWidth, 1);
  uniforms.uPixelRatio.value = jarvisConfig.renderWidth / width;
};
resizeObserver.observe(panel);
resize();

let tabVisible = !document.hidden;
let panelVisible = true;
let loopRunning = false;
let frameId = 0;
const timer = new THREE.Timer();
timer.connect(document);
let fpsFrames = 0;
let fpsWindowStart = 0;
let currentFps = 0;
const shouldRender = () => tabVisible && panelVisible;
const startLoop = () => {
  if (!loopRunning && shouldRender()) {
    loopRunning = true;
    frameId = requestAnimationFrame(render);
  }
};
const stopLoop = () => {
  if (loopRunning) {
    cancelAnimationFrame(frameId);
    loopRunning = false;
  }
};
const updateVisibility = () => {
  if (shouldRender()) startLoop();
  else stopLoop();
};
const render = () => {
  if (!shouldRender()) {
    loopRunning = false;
    return;
  }
  timer.update();
  const elapsed = timer.getElapsed();
  uniforms.uTime.value = jarvisConfig.freezeTime ? 0 : elapsed;
  renderer.render(scene, camera);
  if (jarvisConfig.showFps) {
    fpsFrames += 1;
    if (elapsed - fpsWindowStart >= 0.5) {
      currentFps = Math.round(
        fpsFrames / Math.max(elapsed - fpsWindowStart, 0.001),
      );
      fpsFrames = 0;
      fpsWindowStart = elapsed;
      performanceHud.textContent = `${currentFps} FPS  ·  DPR ${uniforms.uPixelRatio.value.toFixed(2)}  ·  ${Math.round(uniforms.uResolution.value.x)}×${Math.round(uniforms.uResolution.value.y)}  ·  ${renderer.info.render.calls} calls  ·  ${renderer.info.render.triangles} tris`;
    }
  }
  frameId = requestAnimationFrame(render);
};
const onVisibilityChange = () => {
  tabVisible = !document.hidden;
  updateVisibility();
};
document.addEventListener("visibilitychange", onVisibilityChange);
const intersectionObserver = new IntersectionObserver(
  ([entry]) => {
    panelVisible = entry.isIntersecting;
    updateVisibility();
  },
  { threshold: 0.01 },
);
intersectionObserver.observe(panel);

// Vite replaces this module during shader HMR. Stop the old RAF and release
// WebGL resources before the replacement creates another context/program.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopLoop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    fullscreenMesh?.geometry?.dispose();
    material.dispose();
    renderer.dispose();
    performanceHud.remove();
  });
}
startLoop();
