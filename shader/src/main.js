import * as THREE from 'three';
import './style.css';
import vertexShader from './shaders/fullscreen.vert.glsl?raw';
import fragmentShader from './shaders/jarvis.frag.glsl?raw';
import common from './shaders/common.glsl?raw';
import background from './shaders/layers/01-background.glsl?raw';
import outerRings from './shaders/layers/04-outer-rings.glsl?raw';
import panels from './shaders/layers/05-panels.glsl?raw';
import innerRings from './shaders/layers/06-inner-rings.glsl?raw';
import energy from './shaders/layers/07-energy.glsl?raw';
import core from './shaders/layers/08-core.glsl?raw';
import orbits from './shaders/layers/09-orbits.glsl?raw';
import particles from './shaders/layers/10-particles.glsl?raw';
import postEffects from './shaders/layers/11-post-effects.glsl?raw';

export const jarvisConfig = {
  transparent: false,
  intensity: 1,
  animationSpeed: 1,
  hudScale: 1.0,
  glowIntensity: 0.82,
  // Temporary CORE_ONLY preview: 8 = background + central core only.
  debugLayer: 8,
  freezeTime: false,
  debugUV: false,
  cyan: '#00E5FF',
  orange: '#FF9A3D'
};
const canvas = document.querySelector('#shader-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: jarvisConfig.transparent, powerPreference: 'high-performance' });
const scene = new THREE.Scene(); const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const uniforms = { uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2() }, uPixelRatio: { value: 1 }, uIntensity: { value: jarvisConfig.intensity }, uAnimationSpeed: { value: jarvisConfig.animationSpeed }, uHudScale: { value: jarvisConfig.hudScale }, uGlowIntensity: { value: jarvisConfig.glowIntensity }, uTransparent: { value: jarvisConfig.transparent }, uDebugLayer: { value: jarvisConfig.debugLayer }, uFreezeTime: { value: jarvisConfig.freezeTime }, uDebugUV: { value: jarvisConfig.debugUV } };
const source = [common, background, outerRings, panels, innerRings, energy, core, orbits, particles, postEffects, fragmentShader].join('\n');
const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader: source, uniforms, transparent: jarvisConfig.transparent, depthTest: false, depthWrite: false });
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
const resize = () => { const w = canvas.clientWidth || innerWidth; const h = canvas.clientHeight || innerHeight; const dpr = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); uniforms.uResolution.value.set(w * dpr, h * dpr); uniforms.uPixelRatio.value = dpr; };
new ResizeObserver(resize).observe(canvas); resize();
let active = true; let frameId = 0; const timer = new THREE.Timer(); timer.connect(document);
const render = () => { if (!active) return; timer.update(); uniforms.uTime.value = jarvisConfig.freezeTime ? 0 : timer.getElapsed(); renderer.render(scene, camera); frameId = requestAnimationFrame(render); };
document.addEventListener('visibilitychange', () => { active = !document.hidden; if (active) render(); else cancelAnimationFrame(frameId); }); render();
