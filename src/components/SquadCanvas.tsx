import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCarModel } from '../game/engine';

interface SquadCanvasProps {
  blueNames: string[];
  blueColors: number[];
  blueAccents: number[];
  backgroundImage?: string;
  carY?: number;
  carScale?: number;
}

export default function SquadCanvas({
  blueNames,
  blueColors,
  blueAccents,
  backgroundImage = '/mainmenubg.png?v=2',
  carY = -0.6,
  carScale = 0.85
}: SquadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    // Calculate dimensions
    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera Setup (Slightly further back and wider FOV to fit all cars)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.5);
    camera.lookAt(0, 0.4, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    containerRef.current.appendChild(renderer.domElement);

    // 4. Sunny Outdoor / Daylight Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 5.0);
    sunLight.position.set(5, 12, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    scene.add(sunLight);

    // Light-blue sky fill representing the ambient sky dome
    const skyLight = new THREE.HemisphereLight(0xffffff, 0x90b9f0, 2.0);
    scene.add(skyLight);

    // Define V-formation positions for up to 4 cars
    // Slot 0: Center, forward
    // Slot 1: Left, slightly back
    // Slot 2: Right, slightly back
    // Slot 3: Far Left, further back
    const positions = [
      { x: 0, z: -1.7, rotY: 0 },                      // Host
      { x: -1.6, z: -2.3, rotY: 0.15 },            // Mate 1
      { x: 1.6, z: -2.3, rotY: -0.15 },             // Mate 2
      { x: -3.0, z: -2.9, rotY: 0.25 }             // Mate 3
    ];

    // Underglow and ring assets array for animation
    const animElements: Array<{
      glowPlane: THREE.Mesh;
      ring1: THREE.Mesh;
      ring2: THREE.Mesh;
      ringMat1: THREE.MeshBasicMaterial;
      ringMat2: THREE.MeshBasicMaterial;
    }> = [];

    // Filter out empty names to find actual squad members
    const activeMembers = blueNames.map((name, index) => ({
      name,
      color: blueColors[index] !== undefined ? blueColors[index] : 0x00d2ff,
      accent: blueAccents[index] !== undefined ? blueAccents[index] : 0xff00ff,
      index
    })).filter(m => m.name !== '');

    // Render active cars
    activeMembers.forEach((member, i) => {
      // Use positional slot based on their index in the blue list to maintain persistent positions
      const slotIdx = Math.min(member.index, positions.length - 1);
      const pos = positions[slotIdx];

      const carGroup = new THREE.Group();
      carGroup.position.set(pos.x, carY, pos.z);
      scene.add(carGroup);

      // --- Underglow / Platform Glow for each car ---
      const hexColor = '#' + member.color.toString(16).padStart(6, '0');

      // Radial glow plane
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 128; glowCanvas.height = 128;
      const gCtx = glowCanvas.getContext('2d');
      if (gCtx) {
        const grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, hexColor);
        grad.addColorStop(0.3, hexColor + 'aa');
        grad.addColorStop(0.7, hexColor + '22');
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
      const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.2 * carScale, 3.2 * carScale), glowMat);
      glowPlane.rotation.x = -Math.PI / 2;
      glowPlane.position.y = 0.015;
      carGroup.add(glowPlane);

      // Inner Ring
      const ringGeo1 = new THREE.RingGeometry(1.0 * carScale, 1.07 * carScale, 64);
      const ringMat1 = new THREE.MeshBasicMaterial({
        color: member.color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
      ring1.rotation.x = -Math.PI / 2;
      ring1.position.y = 0.02;
      carGroup.add(ring1);

      // Outer Ring
      const ringGeo2 = new THREE.RingGeometry(1.15 * carScale, 1.20 * carScale, 64);
      const ringMat2 = new THREE.MeshBasicMaterial({
        color: member.accent,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.y = 0.018;
      carGroup.add(ring2);

      // Direct light projection
      const underLight = new THREE.PointLight(member.color, 3.0, 4.0);
      underLight.position.set(0, 0.12, 0);
      carGroup.add(underLight);

      // Store animation elements
      animElements.push({
        glowPlane,
        ring1,
        ring2,
        ringMat1,
        ringMat2
      });

      // --- Create and add Car model ---
      const carData = createCarModel(member.color, member.accent, carScale, (member as any).modelUrl);
      const carModel = carData.group;

      // Position car model perfectly within its parent group
      carModel.position.set(0, 0.05, 0);
      carModel.rotation.y = pos.rotY; // Straight, facing camera with custom angles
      carModel.scale.setScalar(1.2 * carScale);

      carGroup.add(carModel);
    });

    // 5. Animation loop
    let animationFrameId: number;
    let lastTime = 0;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const t = time / 1000;
      const pulse = (Math.sin(t * 4.0) + 1) / 2;

      animElements.forEach((elem) => {
        // Rotate rings in opposite directions
        elem.ring1.rotation.z += delta * 1.0;
        elem.ring2.rotation.z -= delta * 0.6;

        // Pulsing underglows
        elem.glowPlane.scale.setScalar(0.95 + pulse * 0.12);
        (elem.glowPlane.material as THREE.MeshBasicMaterial).opacity = 0.55 + pulse * 0.45;

        elem.ringMat1.opacity = 0.65 + pulse * 0.35;
        elem.ringMat2.opacity = 0.45 + (Math.cos(t * 3.0) + 1) / 2 * 0.35;
      });

      renderer.render(scene, camera);
    };

    requestAnimationFrame((time) => {
      lastTime = time;
      animate(time);
    });

    // 6. Handle Resize
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
  }, [blueNames, blueColors, blueAccents, carY, carScale, backgroundImage]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1,
          backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%', backgroundPosition: 'center'
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
