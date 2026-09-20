import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import vertexShader from "./healthCore.vert.glsl?raw";
import fragmentShader from "./healthCore.frag.glsl?raw";
import "./SystemHealthCore.css";

export default function SystemHealthCore({ health = 100 }) {
  const hostRef=useRef(null);const [rendererType,setRendererType]=useState("initializing");
  useEffect(()=>{const host=hostRef.current;if(!host)return;let renderer,raf,visible=true,pageVisible=!document.hidden,elapsed=0,last=performance.now();try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:"high-performance"});renderer.debug.checkShaderErrors=true;renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.1));host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10),geometry=new THREE.PlaneGeometry(2,2);camera.position.set(0,0,1);const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthTest:false,depthWrite:false,blending:THREE.NormalBlending,extensions:{derivatives:true},uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(1,1)},uHealth:{value:health/100},uMotionEnabled:{value:matchMedia("(prefers-reduced-motion: reduce)").matches?0:1},uDebugStage:{value:0}}});const mesh=new THREE.Mesh(geometry,material);mesh.position.set(0,0,0);mesh.frustumCulled=false;scene.add(mesh);
    material.extensions.derivatives=true;
    const resize=()=>{const b=host.getBoundingClientRect();if(!(b.width>0&&b.height>0))return false;renderer.setSize(b.width,b.height,false);renderer.getDrawingBufferSize(material.uniforms.uResolution.value);renderer.render(scene,camera);return true;};if(!resize())throw new Error("Health Core has zero-sized wrapper");
    setRendererType("webgl");const ro=new ResizeObserver(resize);ro.observe(host);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;});io.observe(host);const onVisibility=()=>{pageVisible=!document.hidden;last=performance.now();};document.addEventListener("visibilitychange",onVisibility);
    const draw=(now)=>{if(pageVisible&&visible){elapsed+=(now-last)/1000;material.uniforms.uTime.value=elapsed;renderer.render(scene,camera);}last=now;raf=requestAnimationFrame(draw);};raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();document.removeEventListener("visibilitychange",onVisibility);geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  }catch(error){if(import.meta.env.DEV)console.warn("Health Core WebGL fallback",error);setRendererType("fallback");}},[health]);
  return <div className="system-health-core system-health-core" ref={hostRef} data-renderer={rendererType}>{rendererType==="fallback"&&<span className="system-health-core__fallback" aria-hidden="true"/>}<div className="system-health-core__label"><strong>{health}%</strong><span>HEALTHY</span></div></div>;
}
