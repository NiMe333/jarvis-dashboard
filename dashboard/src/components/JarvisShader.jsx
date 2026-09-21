import { useEffect, useRef } from "react";
import * as THREE from "three";
import common from "../../../shader/src/shaders/common.glsl?raw";
import background from "../../../shader/src/shaders/layers/01-background.glsl?raw";
import grid from "../../../shader/src/shaders/layers/02-grid.glsl?raw";
import outerRings from "../../../shader/src/shaders/layers/04-outer-rings.glsl?raw";
import panels from "../../../shader/src/shaders/layers/05-panels.glsl?raw";
import innerRings from "../../../shader/src/shaders/layers/06-inner-rings.glsl?raw";
import energy from "../../../shader/src/shaders/layers/07-energy.glsl?raw";
import core from "../../../shader/src/shaders/layers/08-core.glsl?raw";
import particles from "../../../shader/src/shaders/layers/10-particles.glsl?raw";
import postEffects from "../../../shader/src/shaders/layers/11-post-effects.glsl?raw";
import vertexShader from "../../../shader/src/shaders/fullscreen.vert.glsl?raw";
import fragmentMain from "../../../shader/src/shaders/jarvis.frag.glsl?raw";
import "./JarvisShader.css";

const fragmentShader = [common, background, grid, outerRings, panels, innerRings, energy, core, particles, postEffects, fragmentMain].join("\n");

export default function JarvisShader() {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2() },
      uPixelRatio: { value: 1 },
      uIntensity: { value: 1 },
      uAnimationSpeed: { value: 1.65 },
      uHudScale: { value: 1 },
      uGlowIntensity: { value: 0.82 },
      uQuality: { value: 2 },
      uTransparent: { value: true },
      uDebugLayer: { value: 0 },
      uFreezeTime: { value: false },
      uDebugUV: { value: false },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const resize = (width, height) => {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const drawingBufferSize = new THREE.Vector2();
      renderer.getDrawingBufferSize(drawingBufferSize);
      uniforms.uResolution.value.copy(drawingBufferSize);
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
      if (!frameId) renderer.render(scene, camera);
    };
    const bounds = wrapper.getBoundingClientRect();
    renderer.setSize(bounds.width || 1, bounds.height || 1, false);
    const initialBuffer = new THREE.Vector2();
    renderer.getDrawingBufferSize(initialBuffer);
    uniforms.uResolution.value.copy(initialBuffer);
    uniforms.uPixelRatio.value = renderer.getPixelRatio();

    let frameId = 0;
    let inViewport = true;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    uniforms.uAnimationSpeed.value = reducedMotion ? 0 : 1.65;
    const shouldRender = () => !document.hidden && inViewport;
    const render = (now) => {
      frameId = 0;
      if (!shouldRender()) return;
      uniforms.uTime.value = now / 1000;
      renderer.render(scene, camera);
      if (!reducedMotion) frameId = requestAnimationFrame(render);
    };
    const requestRender = () => {
      if (!shouldRender()) return;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(render);
    };
    const resizeObserver = new ResizeObserver(([entry]) => resize(entry.contentRect.width, entry.contentRect.height));
    resizeObserver.observe(wrapper);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (!inViewport && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (inViewport) requestRender();
    }, { threshold: 0.01 });
    intersectionObserver.observe(wrapper);
    const onVisibilityChange = () => {
      if (!shouldRender() && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else requestRender();
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
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={wrapperRef} className="jarvis-shader"><canvas ref={canvasRef} className="jarvis-shader__canvas" aria-label="Animated JARVIS core visualization" /></div>;
}
