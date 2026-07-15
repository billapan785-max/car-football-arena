import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createCarModel } from '../game/engine';

interface GarageCanvasProps {
  color: number;
  accent: number;
  carY?: number;
  carZ?: number;
  carScale?: number;
  backgroundImage?: string;
}

export default function GarageCanvas({ 
  color, 
  accent, 
  carY = -0.6, 
  carZ = -2.2, 
  carScale = 0.85,
  backgroundImage = '/mainmenubg.png'
}: GarageCanvasProps) {
  const pedestalRef = useRef<THREE.Group | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCarRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    // Use absolute window size fallback if client dimensions are not calculated yet (very common on fast mounts)
    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; // null for transparent background 

    // 2. Camera Setup (Dead center, slight angle down, to match image precisely)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 6.0);
    camera.lookAt(0, 0.5, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping to make colors pop like the image
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    containerRef.current.appendChild(renderer.domElement);

    // 4. Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const topSpotLight = new THREE.SpotLight(0xffffff, 4.0, 25, Math.PI / 4, 0.5, 1);
    topSpotLight.position.set(0, 8, 0);
    topSpotLight.castShadow = true;
    scene.add(topSpotLight);

    // Left Blue Light
    const blueFill = new THREE.PointLight(0x00aaff, 2.0, 20);
    blueFill.position.set(-8, 4, 2);
    scene.add(blueFill);

    // Right Orange Light
    const orangeFill = new THREE.PointLight(0xff8800, 2.0, 20);
    orangeFill.position.set(8, 4, 2);
    scene.add(orangeFill);

    
    // 6. High-Tech Rotating Pedestal (Platform) exactly like image
    const pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);
    pedestalRef.current = pedestalGroup;

    // (Pedestal meshes removed to use the background image's pedestal)
    // Move the group down a bit to match the image pedestal height
    pedestalGroup.position.y = carY;
    pedestalGroup.position.z = carZ;

    // --- Dynamic Neon Underglow & 3D Glowing Lights ---
    const underglowGroup = new THREE.Group();
    pedestalGroup.add(underglowGroup);

    // Helper to get hex string from hex number
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const hexAccent = '#' + accent.toString(16).padStart(6, '0');

    // 1. Core soft radial glow plane (matches car color)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128; glowCanvas.height = 128;
    const gCtx = glowCanvas.getContext('2d');
    if (gCtx) {
      const grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, hexColor);
      grad.addColorStop(0.3, hexColor + 'bb'); // semi-transparent
      grad.addColorStop(0.7, hexColor + '33'); // faint
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      gCtx.fillStyle = grad;
      gCtx.fillRect(0, 0, 128, 128);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({ 
      map: glowTex, 
      transparent: true, 
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.0 * carScale, 3.0 * carScale), glowMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.015;
    underglowGroup.add(glowPlane);

    // 2. Twin rotating laser/neon rings of the showroom platform
    const ringGeo1 = new THREE.RingGeometry(1.05 * carScale, 1.12 * carScale, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.02;
    underglowGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(1.22 * carScale, 1.27 * carScale, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.018;
    underglowGroup.add(ring2);

    // 4. Downward point light to project real 3D color reflection onto the environment
    const underLight = new THREE.PointLight(color, 3.5, 4.0);
    underLight.position.set(0, 0.12, 0);
    underglowGroup.add(underLight);

    // 7. Car Loading / Mounting
    const mountCar = () => {
      // Clear previous car
      if (currentCarRef.current) {
        pedestalGroup.remove(currentCarRef.current);
      }

      // Create new car model with matching properties
      const carData = createCarModel(color, accent);
      const carGroup = carData.group;

      // Position the car perfectly centered on top of our pedestal
      carGroup.position.set(0, 0.05, 0);
      carGroup.rotation.y = 0; // Front faces camera
      carGroup.scale.setScalar(1.2 * carScale); 
      
      pedestalGroup.add(carGroup);
      currentCarRef.current = carGroup;
    };

    mountCar();

    // 8. Animation loop
    let animationFrameId: number;
    let lastTime = 0;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Rotate the pedestal and car
      pedestalGroup.rotation.y += delta * 0.4;

      // Rotate neon rings in opposite directions for premium high-tech look
      const t = time / 1000;
      ring1.rotation.z += delta * 1.1;
      ring2.rotation.z -= delta * 0.7;
      
      // Dynamic pulsing effect on core glowing plane
      const pulse = (Math.sin(t * 4.0) + 1) / 2;
      glowPlane.scale.setScalar(0.95 + pulse * 0.12);
      glowPlane.material.opacity = 0.55 + pulse * 0.45;
      
      ringMat1.opacity = 0.65 + pulse * 0.35;
      ringMat2.opacity = 0.45 + (Math.cos(t * 3.0) + 1) / 2 * 0.35;
      
            
      renderer.render(scene, camera);
    };

    requestAnimationFrame((time) => {
      lastTime = time;
      animate(time);
    });

    // 9. Handle Resize with ResizeObserver (Extremely robust, handles all iframe and flex scaling cleanly)
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          
        }
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
    };
  }, [color, accent, carY, carZ, carScale, backgroundImage]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div 
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1,
          backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center'
        }}
      />
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute', top: 0, left: 0,
          width: '100%', 
          height: '100%', 
          zIndex: 5,
          pointerEvents: 'none'
        }} 
      />
    </div>
  );
}