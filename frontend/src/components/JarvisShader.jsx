import { useEffect, useRef } from "react";
import * as THREE from "three";
import common from "../../../shader/src/shaders/common.glsl?raw";
import background from "../../../shader/src/shaders/layers/01-background.glsl?raw";
import grid from "../../../shader/src/shaders/layers/02-grid.glsl?raw";
import coreNetwork from "../../../shader/src/shaders/layers/03-core-network.glsl?raw";
import outerRings from "../../../shader/src/shaders/layers/04-outer-rings.glsl?raw";
import panels from "../../../shader/src/shaders/layers/05-panels.glsl?raw";
import innerRings from "../../../shader/src/shaders/layers/06-inner-rings.glsl?raw";
import energy from "../../../shader/src/shaders/layers/07-energy.glsl?raw";
import core from "../../../shader/src/shaders/layers/08-core.glsl?raw";
import particles from "../../../shader/src/shaders/layers/10-particles.glsl?raw";
import postEffects from "../../../shader/src/shaders/layers/11-post-effects.glsl?raw";
import vertexShader from "../../../shader/src/shaders/fullscreen.vert.glsl?raw";
import fragmentMain from "../../../shader/src/shaders/jarvis.frag.glsl?raw";
import networkFragmentMain from "../../../shader/src/shaders/core-network.frag.glsl?raw";
import { dashboardCopy } from "../config/dashboardContent.js";
import "./JarvisShader.css";

const fragmentShader = [
  common,
  background,
  grid,
  coreNetwork,
  outerRings,
  panels,
  innerRings,
  energy,
  core,
  particles,
  postEffects,
  fragmentMain,
].join("\n");

const networkFragmentShader = [
  common,
  background,
  coreNetwork,
  networkFragmentMain,
].join("\n");

export const CORE_VERTICAL_OFFSET_PX = 0;
export const CORE_VISUAL_SCALE = 1.08;

export const QUALITY_PRESETS = Object.freeze({
  high: {
    dpr: 2.0,
    fps: 120,
    detail: 1.0,
  },

  balanced: {
    dpr: 1.3,
    fps: 60,
    detail: 0.9,
  },

  low: {
    dpr: 0.85,
    fps: 30,
    detail: 0.6,
  },
});

const qualityLevel = (detail) => (detail >= 0.95 ? 2 : detail >= 0.7 ? 1 : 0);

export default function JarvisShader({ quality = "high" }) {
  const wrapperRef = useRef(null);
  const networkCanvasRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const networkCanvas = networkCanvasRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !networkCanvas || !canvas) return undefined;

    const presetName = QUALITY_PRESETS[quality] ? quality : "high";
    const preset = QUALITY_PRESETS[presetName];
    const pixelRatio = Math.min(window.devicePixelRatio || 1, preset.dpr);
    const frameInterval = 1000 / preset.fps;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    // The network is intentionally rendered on its own retained canvas. It is
    // drawn only at startup and after resize, so it adds no work to animation
    // frames from the existing JARVIS core shader.
    const networkRenderer = new THREE.WebGLRenderer({
      canvas: networkCanvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    networkRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.1));
    networkRenderer.setClearColor(0x000000, 0);

    const networkScene = new THREE.Scene();
    const networkCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const networkUniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uIntensity: { value: 1 },
      uHudScale: { value: CORE_VISUAL_SCALE },
      uCoreOffsetY: { value: 0 },
      uTransparent: { value: true },
      uDebugLayer: { value: 0 },
    };
    const networkMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: networkFragmentShader,
      uniforms: networkUniforms,
      depthTest: false,
      depthWrite: false,
    });
    const networkGeometry = new THREE.BufferGeometry();
    networkGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    const networkMesh = new THREE.Mesh(networkGeometry, networkMaterial);
    networkMesh.frustumCulled = false;
    networkScene.add(networkMesh);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2() },
      uPixelRatio: { value: 1 },
      uIntensity: { value: 1 },
      uAnimationSpeed: { value: 1.65 },
      uHudScale: { value: CORE_VISUAL_SCALE },
      uCoreOffsetY: { value: 0 },
      uGlowIntensity: { value: 0.82 },
      uQuality: { value: qualityLevel(preset.detail) },
      uDetail: { value: preset.detail },
      uTransparent: { value: true },
      uDebugLayer: { value: 0 },
      uFreezeTime: { value: false },
      uDebugUV: { value: false },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    let frameId = 0;
    let inViewport = true;
    let reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let activeElapsed = 0;
    let lastActiveSample = 0;
    let lastRenderTime = 0;
    let statsStartedAt = 0;
    let renderedFrames = 0;
    const drawingBufferSize = new THREE.Vector2();
    const networkDrawingBufferSize = new THREE.Vector2();
    uniforms.uAnimationSpeed.value = reducedMotion ? 0 : 1.65;
    const shouldRender = () => !document.hidden && inViewport;

    const recordCanvasMetrics = (cssHeight) => {
      renderer.getDrawingBufferSize(drawingBufferSize);
      uniforms.uResolution.value.copy(drawingBufferSize);
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
      uniforms.uCoreOffsetY.value =
        (CORE_VERTICAL_OFFSET_PX * 2) /
        (Math.max(cssHeight, 1) * Math.max(uniforms.uHudScale.value, 0.01));
      wrapper.dataset.canvasResolution = `${drawingBufferSize.x}x${drawingBufferSize.y}`;
      wrapper.dataset.coreOffsetY = uniforms.uCoreOffsetY.value.toFixed(4);
    };

    const resize = (width, height) => {
      if (!width || !height) return;
      networkRenderer.setSize(width, height, false);
      networkRenderer.getDrawingBufferSize(networkDrawingBufferSize);
      networkUniforms.uResolution.value.copy(networkDrawingBufferSize);
      networkUniforms.uCoreOffsetY.value =
        (CORE_VERTICAL_OFFSET_PX * 2) /
        (Math.max(height, 1) * Math.max(networkUniforms.uHudScale.value, 0.01));
      networkRenderer.render(networkScene, networkCamera);
      renderer.setSize(width, height, false);
      recordCanvasMetrics(height);
      if (!frameId && shouldRender()) renderer.render(scene, camera);
    };

    const bounds = wrapper.getBoundingClientRect();
    networkRenderer.setSize(bounds.width || 1, bounds.height || 1, false);
    networkRenderer.getDrawingBufferSize(networkDrawingBufferSize);
    networkUniforms.uResolution.value.copy(networkDrawingBufferSize);
    networkRenderer.render(networkScene, networkCamera);
    renderer.setSize(bounds.width || 1, bounds.height || 1, false);
    recordCanvasMetrics(bounds.height || 1);
    wrapper.dataset.quality = presetName;
    wrapper.dataset.targetFps = String(preset.fps);
    wrapper.dataset.dpr = renderer.getPixelRatio().toFixed(2);

    const render = (now) => {
      frameId = 0;
      if (!shouldRender()) return;

      if (!lastActiveSample) {
        lastActiveSample = now;
        lastRenderTime = now - frameInterval;
        statsStartedAt = now;
      }
      activeElapsed += now - lastActiveSample;
      lastActiveSample = now;

      if (reducedMotion || now - lastRenderTime >= frameInterval) {
        uniforms.uTime.value = activeElapsed / 1000;
        renderer.render(scene, camera);
        lastRenderTime = now - ((now - lastRenderTime) % frameInterval);
        renderedFrames += 1;

        const statsWindow = now - statsStartedAt;
        if (statsWindow >= 1000) {
          wrapper.dataset.renderFps = (
            (renderedFrames * 1000) /
            statsWindow
          ).toFixed(1);
          statsStartedAt = now;
          renderedFrames = 0;
        }
      }

      if (!reducedMotion) frameId = requestAnimationFrame(render);
    };

    const requestRender = () => {
      if (!shouldRender()) return;
      if (frameId) cancelAnimationFrame(frameId);
      lastActiveSample = 0;
      statsStartedAt = 0;
      renderedFrames = 0;
      frameId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(([entry]) =>
      resize(entry.contentRect.width, entry.contentRect.height),
    );
    resizeObserver.observe(wrapper);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
        if (!inViewport && frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
          lastActiveSample = 0;
        } else if (inViewport) {
          requestRender();
        }
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(wrapper);

    const onVisibilityChange = () => {
      if (!shouldRender() && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
        lastActiveSample = 0;
      } else {
        requestRender();
      }
    };
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (event) => {
      reducedMotion = event.matches;
      uniforms.uAnimationSpeed.value = reducedMotion ? 0 : 1.65;
      requestRender();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);
    renderer.render(scene, camera);
    if (!reducedMotion) requestRender();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      scene.remove(mesh);
      networkScene.remove(networkMesh);
      networkGeometry.dispose();
      networkMaterial.dispose();
      networkRenderer.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [quality]);

  return (
    <div ref={wrapperRef} className="jarvis-shader">
      <canvas
        ref={networkCanvasRef}
        className="jarvis-shader__network-canvas"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="jarvis-shader__canvas"
        aria-label={dashboardCopy.accessibility.animatedCore}
      />
    </div>
  );
}
