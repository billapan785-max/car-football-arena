import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function createTechTexture(type: 'orange_stripes' | 'white_stripes' | 'tech_grid_orange' | 'tech_grid_white') {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  if (type === 'orange_stripes') {
    // Bright Orange background
    ctx.fillStyle = "#ff6a00";
    ctx.fillRect(0, 0, 512, 128);

    // Darker/neon orange stripes
    ctx.fillStyle = "#e04f00";
    for (let x = -128; x < 512 + 128; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 32, 0);
      ctx.lineTo(x + 32 + 48, 128);
      ctx.lineTo(x + 48, 128);
      ctx.closePath();
      ctx.fill();
    }

    // White glowing tech highlights on edges
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, 512, 128);

    // Glowing dot patterns on the side
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(40 + i * 20, 64, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(512 - 40 - i * 20, 64, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'white_stripes') {
    // Clean White background
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, 512, 128);

    // Bright Orange stripes
    ctx.fillStyle = "#ff7a00";
    for (let x = -128; x < 512 + 128; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 32, 0);
      ctx.lineTo(x + 32 + 48, 128);
      ctx.lineTo(x + 48, 128);
      ctx.closePath();
      ctx.fill();
    }

    // Deep gray/orange highlights
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, 512, 128);

    // Dot patterns
    ctx.fillStyle = "#111111";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(40 + i * 20, 64, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(512 - 40 - i * 20, 64, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'tech_grid_orange') {
    // Deep orange/black background
    ctx.fillStyle = "#110700";
    ctx.fillRect(0, 0, 512, 128);

    // Orange Grid lines
    ctx.strokeStyle = "#ff6a00";
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
    for (let y = 0; y <= 128; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Bold tech text in the center
    ctx.fillStyle = "#ff8800";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("» BOOST ARENA «", 256, 64);
  } else { // tech_grid_white
    // Deep carbon background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, 512, 128);

    // White grid lines
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
    for (let y = 0; y <= 128; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Bold white text in the center
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("» READY PLAYER 1 «", 256, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

type Phase = "loading" | "playing" | "replay" | "resolving" | "submitted";
type GoalSide = "player" | "ai";

type Car = {
  id: string;
  group: THREE.Group;
  wheels: THREE.Object3D[];
  shadow: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  radius: number;
  boost: number;
  onGround: boolean;
  jumpLatch: boolean;
  boostTrail: THREE.Mesh[];
  punch: number;
};

type Pad = {
  mesh: THREE.Group;
  core: THREE.Mesh;
  x: number;
  z: number;
  cooldown: number;
};

type Spark = {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
};

let FIELD_W = 25;
let FIELD_L = 42;
let GOAL_W = 9.2;
let GOAL_DEPTH = 3.6;
let BALL_RADIUS = 0.72;
const CAR_Y = 0.08;
const SKY = 0x5ea6e6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const len2 = (x: number, z: number) => Math.hypot(x, z);
const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function contactShadow(radius: number) {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function setActorFacing(group: THREE.Group, forward: { x: number, z: number }) {
  const target = new THREE.Vector3(group.position.x + forward.x, group.position.y, group.position.z + forward.z);
  group.lookAt(target);
}

const loader = new GLTFLoader();
let cachedGltf: any = null;
let isLoadingGltf = false;
const gltfCallbacks: ((gltf: any) => void)[] = [];

function loadCarGltf(onLoad: (gltf: any) => void) {
  if (cachedGltf) {
    onLoad(cachedGltf);
    return;
  }
  gltfCallbacks.push(onLoad);
  if (isLoadingGltf) return;
  isLoadingGltf = true;

  loader.load(
    '/car.glb',
    (gltf) => {
      cachedGltf = gltf;
      isLoadingGltf = false;
      const callbacks = [...gltfCallbacks];
      gltfCallbacks.length = 0;
      callbacks.forEach((cb) => cb(gltf));
    },
    undefined,
    (error) => {
      console.error("Error loading /car.glb:", error);
      isLoadingGltf = false;
    }
  );
}

function createCyberFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Deep dark futuristic hexagon-like grid background
  ctx.fillStyle = "#0a0712";
  ctx.fillRect(0, 0, 512, 512);

  // Hexagonal wireframe grid
  ctx.strokeStyle = "rgba(0, 242, 255, 0.25)";
  ctx.lineWidth = 1.5;
  const size = 32;
  const h = size * Math.sqrt(3);
  for (let y = -h; y < 512 + h; y += h) {
    for (let x = -size; x < 512 + size; x += size * 3) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size * 1.5, y + h / 2);
      ctx.lineTo(x + size, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x - size * 0.5, y + h / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Glowing hot pink and electric blue grid lines
  ctx.strokeStyle = "rgba(255, 0, 150, 0.35)";
  ctx.lineWidth = 2.0;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Outer bold border
  ctx.strokeStyle = "#00f2ff";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  return texture;
}

export function createCarModel(color: number, accent: number, scale: number = 1.0): { group: THREE.Group; wheels: THREE.Object3D[] } {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  const placeholderGroup = new THREE.Group();

  // Body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.2), bodyMat);
  body.position.y = 0.4;
  placeholderGroup.add(body);
  
  // Cabin
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x121827, roughness: 0.1 });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.4), cabinMat);
  cabin.position.set(0, 0.8, -0.2);
  placeholderGroup.add(cabin);

  // Nozzle & Fins
  const flameMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.55, roughness: 0.28 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x2d3347, metalness: 0.75, roughness: 0.22 });
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.32, 18), nozzleMat);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 0.44, 1.6);
  
  const finL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.62), flameMat);
  finL.position.set(-0.75, 0.58, 1.3);
  finL.rotation.z = -0.22;
  
  const finR = finL.clone();
  finR.position.x = 0.75;
  finR.rotation.z = 0.22;
  
  placeholderGroup.add(nozzle, finL, finR);

  // Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  
  for (const x of [-0.9, 0.9]) {
    for (const z of [-1.0, 1.0]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, 0.35, z);
      placeholderGroup.add(wheel);
      wheels.push(wheel);
    }
  }

  placeholderGroup.scale.setScalar(0.65);
  group.add(placeholderGroup);

  // Load the car model asynchronously or from memory cache
  loadCarGltf((gltf) => {
    const carModel = gltf.scene.clone();
    const modelWheels: THREE.Object3D[] = [];
    
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Retain original material but mix color to differentiate players
        if (child.material) {
          child.material = child.material.clone();
          child.material.metalness = 0.1;
          child.material.roughness = 0.6;
          
          // Force material to be fully opaque so the hollow/glitched inside of the car is never visible
          child.material.transparent = false;
          child.material.opacity = 1.0;
          if ('transmission' in child.material) child.material.transmission = 0.0;
          if ('thickness' in child.material) child.material.thickness = 0.0;
          
          // Use onBeforeCompile shader injection to paint only the body (mask = color_1 attribute)
          // This keeps the tires, windows, and mirrors in their original texture colors while 
          // coloring the body in beautiful solid pink, blue, green, etc.!
          const paintColorUniform = { value: new THREE.Color(color) };
          child.material.userData = child.material.userData || {};
          child.material.userData.paintColorUniform = paintColorUniform;
          
          child.material.onBeforeCompile = (shader: any) => {
            shader.uniforms.uPaintColor = paintColorUniform;
            
            // 1. Vertex Shader: Bind color_1 attribute and pass as varying
            shader.vertexShader = shader.vertexShader.replace(
              'void main() {',
              `
              attribute vec4 color_1;
              varying vec4 vColor1;
              void main() {
                vColor1 = color_1;
              `
            );
            
            // 2. Fragment Shader: Declare varying and uniform
            shader.fragmentShader = shader.fragmentShader.replace(
              'void main() {',
              `
              varying vec4 vColor1;
              uniform vec3 uPaintColor;
              void main() {
              `
            );
            
            // Replace the map fragment to apply paint color only where vColor1.r > 0.5 (body mask)
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              `
              #include <map_fragment>
              if (vColor1.r > 0.5) {
                float maxVal = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
                float minVal = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
                float sat = maxVal - minVal;
                
                // Do not paint very dark details (like tires, wheel hubs, vents)
                bool isDark = maxVal < 0.24;
                
                // Do not paint bright, desaturated reflective surfaces (like chrome mirrors, glass, headlight reflectors)
                bool isBrightMirrorOrGlass = minVal > 0.62 && sat < 0.15;
                
                if (!isDark && !isBrightMirrorOrGlass) {
                  diffuseColor.rgb = uPaintColor;
                }
              }
              `
            );
          };
        }
        if (child.name && child.name.toLowerCase().includes('wheel')) {
          if (!modelWheels.includes(child)) {
            modelWheels.push(child);
          }
        }
      }
    });
    
    // Position and scale to match the physics and placeholder size
    carModel.scale.setScalar(0.52); 
    
    // Temporarily hide shadow/ground/floor/light/plane meshes to get an accurate bounding box of the wheels/body
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        const name = (child.name || "").toLowerCase();
        if (name.includes("shadow") || name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("light")) {
          child.visible = false;
        }
      }
    });

    // Compute the bounding box of the scaled model
    const box = new THREE.Box3().setFromObject(carModel);
    const minY = box.min.y;

    // Restore visibility
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        const name = (child.name || "").toLowerCase();
        if (name.includes("shadow") || name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("light")) {
          child.visible = true;
        }
      }
    });
    
    // Align tires perfectly with the ground plane (World Y = 0)
    carModel.position.y = -minY - CAR_Y;
    carModel.rotation.y = 0; 
    
    // Swap placeholder with real model
    placeholderGroup.visible = false;
    group.remove(placeholderGroup);
    group.add(carModel);

    // Dynamic wheel reference swapping so the real model wheels rotate!
    if (modelWheels.length > 0) {
      wheels.length = 0;
      wheels.push(...modelWheels);
    }
  });

  group.scale.setScalar(scale);
  return { group, wheels };
}

export function createGame(mount: HTMLElement, carOptions?: { color: number; accent: number, isOnline?: boolean, matchMode?: string, stadiumId?: string, teamColors?: {color: number, accent: number}[] }) {
  const isCyber = carOptions?.stadiumId === 'cyber';
  if (isCyber) {
    FIELD_W = 100;
    FIELD_L = 168;
    GOAL_W = 36.8;
    GOAL_DEPTH = 14.4;
    BALL_RADIUS = 2.5;
  } else {
    FIELD_W = 25;
    FIELD_L = 42;
    GOAL_W = 9.2;
    GOAL_DEPTH = 3.6;
    BALL_RADIUS = 0.72;
  }
  let starfield: THREE.Points | null = null;
  const audienceMembers: { mesh: THREE.Mesh; baseY: number; phaseOffset: number; amplitude: number; speed: number }[] = [];

  const lcdCanvas = document.createElement("canvas");
  lcdCanvas.width = 1024;
  lcdCanvas.height = 512;
  const lcdCtx = lcdCanvas.getContext("2d")!;
  const lcdTexture = new THREE.CanvasTexture(lcdCanvas);
  lcdTexture.colorSpace = THREE.SRGBColorSpace;
  lcdTexture.minFilter = THREE.LinearFilter;
  lcdTexture.magFilter = THREE.LinearFilter;

  const screenCanvases: HTMLCanvasElement[] = [];
  const screenCtxs: CanvasRenderingContext2D[] = [];
  const techTextures: THREE.CanvasTexture[] = [];

  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    screenCanvases.push(canvas);
    screenCtxs.push(ctx);
    techTextures.push(texture);
  }

  let goalBannerTimer = 0;
  let goalBannerScorer: GoalSide | null = null;

  type ReplayFrame = {
    player: { x: number; y: number; z: number; yaw: number; boost: number; onGround: boolean; vx: number; vy: number; vz: number };
    ai: { x: number; y: number; z: number; yaw: number; boost: number; onGround: boolean; vx: number; vy: number; vz: number };
    ball: { x: number; y: number; z: number; vx: number; vz: number; spinX: number; spinZ: number; lastSpeed: number };
    playerBoostVisual: boolean;
    aiBoostVisual: boolean;
    isHit: boolean;
  };

  const replayBuffer: ReplayFrame[] = [];
  const REPLAY_MAX_FRAMES = 240; // ~4 seconds of buffer at 60fps
  let replayActiveFrames: ReplayFrame[] = [];
  let replayPlaybackIndex = 0;
  let ballHitThisFrame = false;
  let replayOverlay: HTMLDivElement | null = null;
  let gameTimeS = 0;

  const cycleMessages = [
    "★ CAR FOOTBALL ARENA ★",
    "⚡ PRESS [SHIFT] TO BOOST ⚡",
    "☄️ NEON ARENA ULTRALIGHT ☄️",
    "⚽ KICK THE BALL TO SCORE! ⚽",
    "🏎️ STRIKER CAR VS AI BOT 🏎️",
    "✨ DRIVE & DRIFT FOR VICTORY ✨",
    "🔥 HYPER SPEED ACTIVE 🔥"
  ];

  let phase: Phase = "loading";
  let raf = 0;
  let lastMs = 0;
  let disposed = false;
  
  let submitted = false;
  let isFirstKickoff = true;
  let cameraMode: "Close" | "Far" | "2D" = "Close";
  
  // Input state
  const keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false, shift: false, space: false, enter: false };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k in keys) (keys as any)[k] = true;
    if (e.code === 'Space') keys.space = true;
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k in keys) (keys as any)[k] = false;
    if (e.code === 'Space') keys.space = false;
  };
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  const SKY_COLOR = isCyber ? 0x05040d : SKY;

  const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(SKY_COLOR, 1);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = !isMobile;
  if (!isMobile) {
    renderer.shadowMap.type = THREE.BasicShadowMap;
  }
  renderer.domElement.className = "boostball-canvas";
  mount.append(renderer.domElement);

  const onResize = () => {
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.FogExp2(SKY_COLOR, isCyber ? 0.0016 : 0.0012);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 2000);
  camera.position.set(0, 9, 22);
  camera.lookAt(0, 1, 0);

  // Intense, daylight-like hemisphere light
  const hemi = isCyber
    ? new THREE.HemisphereLight(0xffffff, 0x8cb4e6, 3.8)
    : new THREE.HemisphereLight(0xffffff, 0x8cb4e6, 3.5);
  scene.add(hemi);

  // Massive sun directional light to cover the enlarged 100x168 field
  const sun = isCyber
    ? new THREE.DirectionalLight(0xffffff, 4.5)
    : new THREE.DirectionalLight(0xffffff, 4.0);
  sun.position.set(-80, 110, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 110;
  sun.shadow.camera.bottom = -110;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 280;
  scene.add(sun);

  // High-intensity fill light from opposite corner to eliminate dark spots
  const fillLight = new THREE.DirectionalLight(0xecf4ff, isCyber ? 2.5 : 2.0);
  fillLight.position.set(80, 90, -60);
  scene.add(fillLight);

  // Strong ambient light to lift all shadows so the stadium looks fully illuminated like daytime
  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);

  if (isCyber) {
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 320 + Math.random() * 150;
      starPositions[i] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i+1] = Math.abs(dist * Math.sin(phi) * Math.sin(theta)) + 15.0; // Raise slightly above horizon
      starPositions[i+2] = dist * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true
    });
    starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);
  }
  
  const goalGlowA = new THREE.PointLight(0x1f86ff, 1.3, 26);
  goalGlowA.position.set(0, 4, FIELD_L / 2 + 1);
  const goalGlowB = new THREE.PointLight(0xff3d3d, 1.3, 26);
  goalGlowB.position.set(0, 4, -FIELD_L / 2 - 1);
  scene.add(goalGlowA, goalGlowB);

  // DOM Elements binding via querying mount directly
  const dom = mount.querySelector('.boostball-ui') as HTMLElement;
  const playerScoreEl = mount.querySelector("[data-player]");
  const aiScoreEl = mount.querySelector("[data-ai]");
  const clockEl = mount.querySelector("[data-clock]");
  const statusEl = mount.querySelector("[data-status]");
  const boostBarEl = mount.querySelector("[data-boost-bar]") as HTMLElement;
  const boostTextEl = mount.querySelector("[data-boost-text]");
  const toastEl = mount.querySelector("[data-toast]");
  const resolveEl = mount.querySelector("[data-resolve]");
  const resultTitleEl = mount.querySelector("[data-result-title]");
  const resultSubEl = mount.querySelector("[data-result-sub]");
  const loadingEl = mount.querySelector("[data-loading]");
  const camToggleBtn = mount.querySelector("[data-cam-toggle]");
  
  if (camToggleBtn) {
    camToggleBtn.addEventListener("click", () => {
      if (cameraMode === "Close") cameraMode = "Far";
      else if (cameraMode === "Far") cameraMode = "2D";
      else cameraMode = "Close";
      camToggleBtn.textContent = `View: ${cameraMode}`;
    });
  }

  // Initialize replay overlay
  replayOverlay = document.createElement("div");
  replayOverlay.className = "boostball-replay-overlay";
  replayOverlay.style.position = "absolute";
  replayOverlay.style.top = "24px";
  replayOverlay.style.right = "24px";
  replayOverlay.style.background = "rgba(0, 0, 0, 0.75)";
  replayOverlay.style.border = "2px solid #ef4444";
  replayOverlay.style.color = "#ffffff";
  replayOverlay.style.padding = "8px 16px";
  replayOverlay.style.borderRadius = "8px";
  replayOverlay.style.fontFamily = "'JetBrains Mono', monospace";
  replayOverlay.style.fontSize = "1rem";
  replayOverlay.style.fontWeight = "900";
  replayOverlay.style.zIndex = "100";
  replayOverlay.style.display = "none";
  replayOverlay.style.alignItems = "center";
  replayOverlay.style.gap = "8px";
  replayOverlay.style.pointerEvents = "none";
  replayOverlay.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.5)";

  const blinkDot = document.createElement("span");
  blinkDot.style.width = "12px";
  blinkDot.style.height = "12px";
  blinkDot.style.borderRadius = "50%";
  blinkDot.style.background = "#ef4444";
  blinkDot.style.display = "inline-block";
  blinkDot.style.animation = "replay-blink 1s infinite alternate";

  const textNode = document.createTextNode("INSTANT REPLAY");
  replayOverlay.appendChild(blinkDot);
  replayOverlay.appendChild(textNode);

  // Append keyframe styles for blinking
  const blinkStyle = document.createElement("style");
  blinkStyle.textContent = `
    @keyframes replay-blink {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0.2; transform: scale(0.85); }
    }
  `;
  document.head.appendChild(blinkStyle);

  const uiContainer = mount.querySelector('.boostball-ui');
  if (uiContainer) {
    uiContainer.appendChild(replayOverlay);
  }

  const floorGroup = new THREE.Group();
  scene.add(floorGroup);
  const arenaGroup = new THREE.Group();
  scene.add(arenaGroup);

  const scale = isCyber ? 2.0 : 1.0;
  const carStartOffset = isCyber ? 14 : 3.5;
  const extraCarStartOffset = isCyber ? 12 : 3.0;

  const playerColor = carOptions?.color ?? 0x126dff;
  const playerAccent = carOptions?.accent ?? 0x21f6ff;
  const playerVisual = createCarModel(playerColor, playerAccent, scale);
  const player: Car = {
    id: "player_rocket_car",
    group: playerVisual.group,
    wheels: playerVisual.wheels,
    shadow: contactShadow(0.85 * scale),
    x: 0,
    y: CAR_Y,
    z: FIELD_L / 2 - carStartOffset,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: Math.PI,
    radius: 0.58 * scale,
    boost: 100,
    onGround: true,
    jumpLatch: false,
    boostTrail: [],
    punch: 0
  };
  player.group.name = "player_rocket_car";
  player.group.castShadow = true;
  scene.add(player.shadow, player.group);

  const aiVisual = createCarModel(0xff332e, 0xffd12d, scale);
  const ai: Car = {
    id: "ai_striker_car",
    group: aiVisual.group,
    wheels: aiVisual.wheels,
    shadow: contactShadow(0.82 * scale),
    x: 0,
    y: CAR_Y,
    z: -FIELD_L / 2 + carStartOffset,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    radius: 0.55 * scale,
    boost: 100,
    onGround: true,
    jumpLatch: false,
    boostTrail: [],
    punch: 0
  };
  const extraCars: Car[] = [];
  const extraCount = (carOptions?.matchMode === '1v1' || carOptions?.matchMode === 'practice') ? 0 : carOptions?.matchMode === '2v2' ? 1 : 2;
  const teamColors = carOptions?.teamColors;
  
  for (let i = 0; i < extraCount; i++) {
    const allyColor = teamColors && teamColors[i + 1] ? teamColors[i + 1].color : playerColor;
    const allyAccent = teamColors && teamColors[i + 1] ? teamColors[i + 1].accent : playerAccent;
    const cAlly = createCarModel(allyColor, allyAccent, scale);
    const cAllyObj: Car = { ...player, id: "ally"+i, group: cAlly.group, wheels: cAlly.wheels, shadow: contactShadow(0.85 * scale), boostTrail: [] };
    cAllyObj.x = i === 0 ? -extraCarStartOffset : extraCarStartOffset;
    cAllyObj.z = FIELD_L / 2 - carStartOffset;
    extraCars.push(cAllyObj);
    cAllyObj.group.castShadow = true;
    scene.add(cAllyObj.shadow, cAllyObj.group);
    
    // For opponents, we can also pick random colors if not provided
    const cOpp = createCarModel(0xff332e, 0xffd12d, scale);
    const cOppObj: Car = { ...ai, id: "opp"+i, group: cOpp.group, wheels: cOpp.wheels, shadow: contactShadow(0.82 * scale), boostTrail: [] };
    cOppObj.x = i === 0 ? -extraCarStartOffset : extraCarStartOffset;
    cOppObj.z = -FIELD_L / 2 + carStartOffset;
    extraCars.push(cOppObj);
    cOppObj.group.castShadow = true;
    scene.add(cOppObj.shadow, cOppObj.group);
  }
  ai.group.name = "ai_striker_car";
  if (carOptions?.matchMode !== 'practice') {
    scene.add(ai.shadow, ai.group);
  } else {
    ai.x = 9999;
    ai.y = -9999;
    ai.z = 9999;
  }

  const ballMeshGroup = new THREE.Group();

  // Load the beautiful custom skin that matches the user's uploaded football skin
  const textureLoader = new THREE.TextureLoader();
  const footballSkinTex = textureLoader.load('/football_skin.jpg');
  footballSkinTex.colorSpace = THREE.SRGBColorSpace;
  
  const skinnedFootballSphere = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 64, 64),
    new THREE.MeshStandardMaterial({
      map: footballSkinTex,
      roughness: 0.18,
      metalness: 0.12
    })
  );
  skinnedFootballSphere.castShadow = true;
  skinnedFootballSphere.receiveShadow = true;
  ballMeshGroup.add(skinnedFootballSphere);

  const ball = {
    mesh: ballMeshGroup,
    ring: new THREE.Mesh(
      new THREE.TorusGeometry(BALL_RADIUS * 1.02, 0.035, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0x62f5ff, transparent: true, opacity: 0.92 })
    ),
    shadow: contactShadow(BALL_RADIUS * 1.1),
    x: 0,
    y: BALL_RADIUS,
    z: 0,
    vx: 0,
    vz: 0,
    spinX: 0,
    spinZ: 0,
    lastSpeed: 0
  };
  ball.mesh.name = "mega_ball";
  scene.add(ball.shadow, ball.mesh, ball.ring);

  const pads: Pad[] = [];
  const sparks: Spark[] = [];
  const reusableCamPos = new THREE.Vector3();
  const reusableLook = new THREE.Vector3();
  const reusableRight = new THREE.Vector3();

  const run = {
    playerGoals: 0,
    aiGoals: 0,
    timeLeft: 300,
    overtime: false,
    kickoff: 5.8,
    aiDelay: 1.0,
    firstHit: false,
    firstHitSpeed: 0,
    shots: 0,
    lastGoal: null as GoalSide | null,
    toast: "",
    toastTime: 0,
    countdownCue: 11
  };
  let playerBoostVisual = false;
  let aiBoostVisual = false;

  function createTrail(color: number): THREE.Mesh[] {
    const trail: THREE.Mesh[] = [];
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 5; i += 1) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16 + i * 0.045, 0.7, 14), mat.clone());
      flame.rotation.x = -Math.PI / 2;
      scene.add(flame);
      trail.push(flame);
    }
    return trail;
  }

  player.boostTrail = createTrail(0x43f5ff);
  ai.boostTrail = createTrail(0xffb02e);
  for (const c of extraCars) {
    c.boostTrail = createTrail(c.id.startsWith("ally") ? playerColor : 0xffb02e);
  }

  function createNetTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    
    ctx.clearRect(0, 0, 128, 128);
    
    // Slight shadow grid for high contrast depth and 3D perception
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 3.0;
    ctx.beginPath(); ctx.moveTo(0, 65); ctx.lineTo(128, 65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(65, 0); ctx.lineTo(65, 128); ctx.stroke();

    // Clean white mesh grid lines matching user's photo
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(0, 64); ctx.lineTo(128, 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.stroke();
    
    // Knotted intersections
    ctx.fillStyle = "#f5f5f7";
    ctx.beginPath();
    ctx.arc(64, 64, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Border edge line to ensure grid is unbroken
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.1;
    ctx.strokeRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  function buildArena() {
    floorGroup.clear();
    arenaGroup.clear();
    audienceMembers.length = 0;

    const textureLoader = new THREE.TextureLoader();
    let floorMat;

    const grassTexture = textureLoader.load('/grass.png');
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(24, 40);

    floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: grassTexture,
      roughness: 0.72,
      metalness: 0.1,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W + 9, FIELD_L + 11), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floorGroup.add(floor);

    const lineMat = isCyber
      ? new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.85, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.58, depthWrite: false });

    const centerRadius = isCyber ? 17.2 : 4.5;
    const center = new THREE.Mesh(new THREE.RingGeometry(centerRadius, centerRadius + (isCyber ? 0.48 : 0.12), 64), lineMat);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.025;
    floorGroup.add(center);
    const midLine = new THREE.Mesh(new THREE.BoxGeometry(FIELD_W + 3, 0.028, 0.12), lineMat);
    midLine.position.set(0, 0.04, 0);
    floorGroup.add(midLine);

    const penaltyBoxOffset = isCyber ? 13.9 : 3.5;
    for (const z of [-FIELD_L / 2 + penaltyBoxOffset, FIELD_L / 2 - penaltyBoxOffset]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(GOAL_W + 3, 0.03, 0.16), lineMat);
      box.position.set(0, 0.04, z);
      floorGroup.add(box);
    }

    // Add four highly realistic corner kick arcs (quarter-circles) at the field corners
    const arcRadius = isCyber ? 3.5 : 1.0;
    const arcThick = isCyber ? 0.35 : 0.1;
    const cornerArcGeo = new THREE.RingGeometry(arcRadius, arcRadius + arcThick, 32, 1, 0, Math.PI / 2);
    cornerArcGeo.rotateX(-Math.PI / 2);

    const arcTL = new THREE.Mesh(cornerArcGeo, lineMat);
    arcTL.position.set(-FIELD_W / 2, 0.025, -FIELD_L / 2);
    arcTL.rotation.y = 0;
    
    const arcTR = new THREE.Mesh(cornerArcGeo, lineMat);
    arcTR.position.set(FIELD_W / 2, 0.025, -FIELD_L / 2);
    arcTR.rotation.y = Math.PI / 2;

    const arcBL = new THREE.Mesh(cornerArcGeo, lineMat);
    arcBL.position.set(-FIELD_W / 2, 0.025, FIELD_L / 2);
    arcBL.rotation.y = -Math.PI / 2;

    const arcBR = new THREE.Mesh(cornerArcGeo, lineMat);
    arcBR.position.set(FIELD_W / 2, 0.025, FIELD_L / 2);
    arcBR.rotation.y = Math.PI;

    floorGroup.add(arcTL, arcTR, arcBL, arcBR);

    let wallMatSide, wallMatEnd;
    if (isCyber) {
      wallMatSide = new THREE.MeshStandardMaterial({ color: 0x07060c, roughness: 0.1, metalness: 0.95 });
      wallMatEnd = new THREE.MeshStandardMaterial({ color: 0x050409, roughness: 0.1, metalness: 0.95 });
    } else {
      const woodTextureSide = textureLoader.load('/wall_wood.jpg');
      woodTextureSide.wrapS = THREE.RepeatWrapping;
      woodTextureSide.wrapT = THREE.RepeatWrapping;
      woodTextureSide.repeat.set(12, 1);

      const woodTextureEnd = textureLoader.load('/wall_wood.jpg');
      woodTextureEnd.wrapS = THREE.RepeatWrapping;
      woodTextureEnd.wrapT = THREE.RepeatWrapping;
      woodTextureEnd.repeat.set(4, 1);

      wallMatSide = new THREE.MeshStandardMaterial({ map: woodTextureSide, roughness: 0.6, metalness: 0.1 });
      wallMatEnd = new THREE.MeshStandardMaterial({ map: woodTextureEnd, roughness: 0.6, metalness: 0.1 });
    }

    const trimBlue = isCyber 
      ? new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x0088cc, emissiveIntensity: 1.5, roughness: 0.1, metalness: 0.9 })
      : new THREE.MeshStandardMaterial({ color: 0x177dff, emissive: 0x063b96, emissiveIntensity: 0.35, roughness: 0.26, metalness: 0.48 });

    const trimRed = isCyber 
      ? new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xcc6600, emissiveIntensity: 1.5, roughness: 0.1, metalness: 0.9 })
      : new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x8f0606, emissiveIntensity: 0.35, roughness: 0.26, metalness: 0.48 });

    const WALL_H = isCyber ? 12.0 : 3.2;
    const BOARD_H = isCyber ? 2.4 : 0.8;
    const GLASS_H = WALL_H - BOARD_H;

    const glassMat = new THREE.MeshStandardMaterial({
      color: isCyber ? 0x00f2ff : 0xddeeff,
      transparent: true,
      opacity: isCyber ? 0.35 : 0.55,
      roughness: 0.05,
      metalness: 0.95,
      side: THREE.DoubleSide
    });

    // 1. Left and Right Side Walls
    const sideBoardL = new THREE.Mesh(new THREE.BoxGeometry(0.8, BOARD_H, FIELD_L + 6), wallMatSide);
    sideBoardL.position.set(-FIELD_W / 2 - 0.45, BOARD_H / 2, 0);
    sideBoardL.receiveShadow = true;
    sideBoardL.castShadow = true;

    const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.1, GLASS_H, FIELD_L + 6), glassMat);
    sideGlassL.position.set(-FIELD_W / 2 - 0.45, BOARD_H + GLASS_H / 2, 0);

    const sideBoardR = sideBoardL.clone();
    sideBoardR.position.x = FIELD_W / 2 + 0.45;

    const sideGlassR = sideGlassL.clone();
    sideGlassR.position.x = FIELD_W / 2 + 0.45;

    arenaGroup.add(sideBoardL, sideGlassL, sideBoardR, sideGlassR);

    // Structural vertical posts spacing the glass panels
    const glassPostMat = new THREE.MeshStandardMaterial({ color: isCyber ? 0x2e3b4e : 0x475569, roughness: 0.4, metalness: 0.8 });
    const spacing = isCyber ? 24.0 : 6.0;
    const numPosts = Math.floor((FIELD_L + 6) / spacing);
    const postGeo = new THREE.BoxGeometry(0.15, WALL_H, 0.15);

    for (let p = 0; p <= numPosts; p++) {
      const pz = - (FIELD_L + 6) / 2 + p * spacing;
      
      const postL = new THREE.Mesh(postGeo, glassPostMat);
      postL.position.set(-FIELD_W / 2 - 0.45, WALL_H / 2, pz);
      postL.castShadow = true;
      
      const postR = postL.clone();
      postR.position.x = FIELD_W / 2 + 0.45;
      
      arenaGroup.add(postL, postR);
    }

    if (isCyber) {
      const neonLeftMat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
      const neonRightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const stripL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, FIELD_L + 6, 8), neonLeftMat);
      stripL.rotation.x = Math.PI / 2;
      stripL.position.set(-FIELD_W / 2 - 0.45, WALL_H + 0.05, 0);

      const stripR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, FIELD_L + 6, 8), neonRightMat);
      stripR.rotation.x = Math.PI / 2;
      stripR.position.set(FIELD_W / 2 + 0.45, WALL_H + 0.05, 0);

      arenaGroup.add(stripL, stripR);
    }

    for (const z of [-FIELD_L / 2 - 0.45, FIELD_L / 2 + 0.45]) {
      const mat = z < 0 ? trimRed : trimBlue;
      const postW = (FIELD_W - GOAL_W) / 2;

      // Solid board at the bottom
      const leftBoard = new THREE.Mesh(new THREE.BoxGeometry(postW, BOARD_H, 0.8), wallMatEnd);
      leftBoard.position.set(-(GOAL_W / 2 + postW / 2), BOARD_H / 2, z);
      leftBoard.receiveShadow = true;
      leftBoard.castShadow = true;

      const rightBoard = leftBoard.clone();
      rightBoard.position.x *= -1;

      // Glass panels above
      const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(postW, GLASS_H, 0.1), glassMat);
      leftGlass.position.set(-(GOAL_W / 2 + postW / 2), BOARD_H + GLASS_H / 2, z);

      const rightGlass = leftGlass.clone();
      rightGlass.position.x *= -1;

      const topThickness = isCyber ? 2.2 : 0.55;
      const top = new THREE.Mesh(new THREE.BoxGeometry(GOAL_W + 1.2, topThickness, 0.85), mat);
      top.position.set(0, WALL_H - topThickness / 2, z);
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(GOAL_W, 0.06, GOAL_DEPTH), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85, depthWrite: false }));
      mouth.position.set(0, 0.09, z + (z < 0 ? -GOAL_DEPTH / 2 : GOAL_DEPTH / 2));
      arenaGroup.add(leftBoard, rightBoard, leftGlass, rightGlass, top, mouth);

      // --- ULTRA PREMIUM 3D GOAL STRUCTURE & NET MESH ---
      const zSign = z < 0 ? -1 : 1;
      const zEnd = z + zSign * GOAL_DEPTH;

      // Solid black backing plates to form a premium dark shell behind the net so the blue sky/lights do not bleed through
      const shellMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9, metalness: 0.1 });
      const shellHeight = WALL_H - 0.1;
      const backShell = new THREE.Mesh(new THREE.BoxGeometry(GOAL_W + 0.1, shellHeight, 0.05), shellMat);
      backShell.position.set(0, shellHeight / 2, zEnd + zSign * 0.05);
      
      const leftShell = new THREE.Mesh(new THREE.BoxGeometry(0.05, shellHeight, GOAL_DEPTH), shellMat);
      leftShell.position.set(-GOAL_W / 2 - 0.03, shellHeight / 2, z + zSign * GOAL_DEPTH / 2);
      
      const rightShell = new THREE.Mesh(new THREE.BoxGeometry(0.05, shellHeight, GOAL_DEPTH), shellMat);
      rightShell.position.set(GOAL_W / 2 + 0.03, shellHeight / 2, z + zSign * GOAL_DEPTH / 2);
      
      arenaGroup.add(backShell, leftShell, rightShell);

      // Glossy white metal post material matching the user's uploaded image or neon glow if in cyber mode
      const postMat = isCyber
        ? new THREE.MeshStandardMaterial({
            color: zSign < 0 ? 0xff00bb : 0x00ffff,
            emissive: zSign < 0 ? 0xff00bb : 0x00ffff,
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.9
          })
        : new THREE.MeshStandardMaterial({
            color: 0xf3f4f6,
            roughness: 0.15,
            metalness: 0.65
          });

      const GOAL_H = isCyber ? 9.6 : 2.9;
      const postRadius = isCyber ? 0.38 : 0.095;
      const barRadius = isCyber ? 0.26 : 0.065;

      // Front Left vertical post
      const leftPostP = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_H, 16), postMat);
      leftPostP.position.set(-GOAL_W / 2, GOAL_H / 2, z);
      leftPostP.castShadow = true;
      leftPostP.receiveShadow = true;

      // Front Right vertical post
      const rightPostP = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_H, 16), postMat);
      rightPostP.position.set(GOAL_W / 2, GOAL_H / 2, z);
      rightPostP.castShadow = true;
      rightPostP.receiveShadow = true;

      // Front top crossbar
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_W, 16), postMat);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, GOAL_H, z);
      crossbar.castShadow = true;
      crossbar.receiveShadow = true;

      // Back top horizontal bar
      const backTopBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, GOAL_W, 16), postMat);
      backTopBar.rotation.z = Math.PI / 2;
      backTopBar.position.set(0, GOAL_H, zEnd);
      backTopBar.castShadow = true;

      // Back bottom horizontal bar
      const backBottomBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, GOAL_W, 16), postMat);
      backBottomBar.rotation.z = Math.PI / 2;
      backBottomBar.position.set(0, 0.05, zEnd);
      backBottomBar.castShadow = true;

      // Left ground depth support bar
      const leftGroundBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, GOAL_DEPTH, 16), postMat);
      leftGroundBar.rotation.x = Math.PI / 2;
      leftGroundBar.position.set(-GOAL_W / 2, 0.05, z + zSign * GOAL_DEPTH / 2);
      leftGroundBar.castShadow = true;

      // Right ground depth support bar
      const rightGroundBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, GOAL_DEPTH, 16), postMat);
      rightGroundBar.rotation.x = Math.PI / 2;
      rightGroundBar.position.set(GOAL_W / 2, 0.05, z + zSign * GOAL_DEPTH / 2);
      rightGroundBar.castShadow = true;

      // Left top depth support bar
      const leftTopBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, GOAL_DEPTH, 16), postMat);
      leftTopBar.rotation.x = Math.PI / 2;
      leftTopBar.position.set(-GOAL_W / 2, GOAL_H, z + zSign * GOAL_DEPTH / 2);
      leftTopBar.castShadow = true;

      // Right top depth support bar
      const rightTopBar = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, GOAL_DEPTH, 16), postMat);
      rightTopBar.rotation.x = Math.PI / 2;
      rightTopBar.position.set(GOAL_W / 2, GOAL_H, z + zSign * GOAL_DEPTH / 2);
      rightTopBar.castShadow = true;

      // Left slanted side support bar (exactly matching the slanted bars in the user's photo!)
      const slantHeightDiff = GOAL_H - 0.05;
      const slantLength = Math.sqrt(GOAL_DEPTH * GOAL_DEPTH + slantHeightDiff * slantHeightDiff);
      const slantAngle = Math.atan2(slantHeightDiff, GOAL_DEPTH);

      const leftSlant = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, slantLength, 16), postMat);
      leftSlant.rotation.x = -zSign * slantAngle;
      leftSlant.position.set(-GOAL_W / 2, (GOAL_H + 0.05) / 2, z + zSign * GOAL_DEPTH / 2);
      leftSlant.castShadow = true;

      const rightSlant = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, slantLength, 16), postMat);
      rightSlant.rotation.x = -zSign * slantAngle;
      rightSlant.position.set(GOAL_W / 2, (GOAL_H + 0.05) / 2, z + zSign * GOAL_DEPTH / 2);
      rightSlant.castShadow = true;

      // Knotted white netting textures
      const netTexBack = createNetTexture();
      netTexBack.repeat.set(16, 6);
      const backNetMat = new THREE.MeshStandardMaterial({
        color: isCyber ? (zSign < 0 ? 0xff00bb : 0x00ffff) : 0xffffff,
        emissive: isCyber ? (zSign < 0 ? 0xdd0099 : 0x00b2cc) : 0x000000,
        emissiveIntensity: isCyber ? 1.0 : 0.0,
        map: netTexBack,
        transparent: true,
        opacity: isCyber ? 0.95 : 0.88,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
        depthWrite: false
      });

      const netTexSide = createNetTexture();
      netTexSide.repeat.set(8, 6);
      const sideNetMat = new THREE.MeshStandardMaterial({
        color: isCyber ? (zSign < 0 ? 0xff00bb : 0x00ffff) : 0xffffff,
        emissive: isCyber ? (zSign < 0 ? 0xdd0099 : 0x00b2cc) : 0x000000,
        emissiveIntensity: isCyber ? 1.0 : 0.0,
        map: netTexSide,
        transparent: true,
        opacity: isCyber ? 0.95 : 0.88,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
        depthWrite: false
      });

      const netTexTop = createNetTexture();
      netTexTop.repeat.set(16, 8);
      const topNetMat = new THREE.MeshStandardMaterial({
        color: isCyber ? (zSign < 0 ? 0xff00bb : 0x00ffff) : 0xffffff,
        emissive: isCyber ? (zSign < 0 ? 0xdd0099 : 0x00b2cc) : 0x000000,
        emissiveIntensity: isCyber ? 1.0 : 0.0,
        map: netTexTop,
        transparent: true,
        opacity: isCyber ? 0.95 : 0.88,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
        depthWrite: false
      });

      // 3D Net planes forming the cage
      const backNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_W, GOAL_H), backNetMat);
      backNet.position.set(0, GOAL_H / 2, zEnd);
      backNet.receiveShadow = true;

      const leftNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_H), sideNetMat);
      leftNet.rotation.y = Math.PI / 2;
      leftNet.position.set(-GOAL_W / 2, GOAL_H / 2, z + zSign * GOAL_DEPTH / 2);
      leftNet.receiveShadow = true;

      const rightNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_H), sideNetMat);
      rightNet.rotation.y = Math.PI / 2;
      rightNet.position.set(GOAL_W / 2, GOAL_H / 2, z + zSign * GOAL_DEPTH / 2);
      rightNet.receiveShadow = true;

      const topNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_W, GOAL_DEPTH), topNetMat);
      topNet.rotation.x = Math.PI / 2;
      topNet.position.set(0, GOAL_H, z + zSign * GOAL_DEPTH / 2);
      topNet.receiveShadow = true;

      arenaGroup.add(
        leftPostP, rightPostP, crossbar,
        backTopBar, backBottomBar,
        leftGroundBar, rightGroundBar,
        leftTopBar, rightTopBar,
        leftSlant, rightSlant,
        backNet, leftNet, rightNet, topNet
      );
    }

    // Perimeter LED Boards alternating on walls (seamless, full-height 2.6)
    let textureCounter = 0;
    const createBoard = (width: number, height: number, posX: number, posY: number, posZ: number, rotY: number) => {
      const tex = techTextures[textureCounter % techTextures.length];
      textureCounter++;

      const boardGroup = new THREE.Group();

      // Thin backing plate
      const frameGeo = new THREE.BoxGeometry(width, height, 0.05);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.8, metalness: 0.2 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      boardGroup.add(frame);

      // Bright glowing screen (exact size for gapless, zero-margin seamless styling)
      const screenGeo = new THREE.PlaneGeometry(width, height);
      const screenMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = 0.03;
      boardGroup.add(screen);

      if (isCyber) {
        const neonColor = (posX < 0) ? 0xff00bb : 0x00ffff;
        const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
        const stripTop = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), neonMat);
        stripTop.position.set(0, height / 2 + 0.04, 0.04);
        const stripBottom = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), neonMat);
        stripBottom.position.set(0, -height / 2 - 0.04, 0.04);
        boardGroup.add(stripTop, stripBottom);
      }

      boardGroup.position.set(posX, posY, posZ);
      boardGroup.rotation.y = rotY;

      arenaGroup.add(boardGroup);
    };

    const sideSpan = FIELD_L + 0.1;
    const numSideBoards = Math.round(sideSpan / 4.0);
    const actualBoardWidth = sideSpan / numSideBoards;
    const sideStart = -sideSpan / 2 + actualBoardWidth / 2;

    // 1. Left Wall (facing +X, rotY = Math.PI / 2)
    for (let i = 0; i < numSideBoards; i++) {
      const z = sideStart + i * actualBoardWidth;
      createBoard(actualBoardWidth, 1.8, -FIELD_W / 2 - 0.05, 0.9, z, Math.PI / 2);
    }

    // 2. Right Wall (facing -X, rotY = -Math.PI / 2)
    for (let i = 0; i < numSideBoards; i++) {
      const z = sideStart + i * actualBoardWidth;
      createBoard(actualBoardWidth, 1.8, FIELD_W / 2 + 0.05, 0.9, z, -Math.PI / 2);
    }

    // End wall segment width from goal edge (GOAL_W / 2) to side edge (FIELD_W / 2 + 0.05)
    const endSegmentWidth = (FIELD_W / 2 + 0.05) - (GOAL_W / 2);
    const endSegmentCenterX = (GOAL_W / 2) + (endSegmentWidth / 2);

    // 3. Red End (facing +Z, rotY = 0)
    createBoard(endSegmentWidth, 1.8, -endSegmentCenterX, 0.9, -FIELD_L / 2 - 0.05, 0);
    createBoard(endSegmentWidth, 1.8, endSegmentCenterX, 0.9, -FIELD_L / 2 - 0.05, 0);

    // 4. Blue End (facing -Z, rotY = Math.PI)
    createBoard(endSegmentWidth, 1.8, -endSegmentCenterX, 0.9, FIELD_L / 2 + 0.05, Math.PI);
    createBoard(endSegmentWidth, 1.8, endSegmentCenterX, 0.9, FIELD_L / 2 + 0.05, Math.PI);

    // Stadium Stands, Audience, and LCDs
    const stepCount = isCyber ? 18 : 9;
    const stepDepth = isCyber ? 2.4 : 1.2;
    const stepHeight = isCyber ? 1.2 : 0.65;
    const concreteMat = isCyber
      ? new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75, metalness: 0.15 })
      : new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8, metalness: 0.1 });
    const concreteAltMat = isCyber
      ? new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75, metalness: 0.15 })
      : new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8, metalness: 0.1 });
    
    const audienceGeo = isCyber ? new THREE.BoxGeometry(0.7, 1.0, 0.7) : new THREE.BoxGeometry(0.35, 0.5, 0.35);
    const audienceMats = [
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.65 }), // Team Red
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.65 }), // Team Blue
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 }), // Team Gold
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 }), // White Jerseys
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.65 }), // Green Jerseys
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.65 })  // Teal Jerseys
    ];

    const generateStands = (isSide: boolean, sign: number) => {
      const group = new THREE.Group();
      const length = isSide ? FIELD_L + 2 : FIELD_W + 18;
      const startDist = isSide ? FIELD_W / 2 + 0.8 : FIELD_L / 2 + 1.2;
      const maxStandHeight = stepHeight * stepCount;
      const maxStandDepth = stepCount * stepDepth;
      
      for (let i = 0; i < stepCount; i++) {
        const mat = i % 2 === 0 ? concreteMat : concreteAltMat;
        const width = length;
        const depth = stepDepth;
        const height = stepHeight * (i + 1);
        
        const dist = startDist + (i * stepDepth) + stepDepth / 2;
        
        if (isSide) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
          step.position.set(sign * dist, height / 2, 0);
          step.rotation.y = Math.PI / 2;
          step.receiveShadow = true;
          step.castShadow = true;
          group.add(step);
        } else {
          // Split the step into Left and Right stands to leave a completely clear gap for the goal nets in the center
          const gapW = GOAL_W + 3.0;
          const boxW = (width - gapW) / 2;
          
          const leftStep = new THREE.Mesh(new THREE.BoxGeometry(boxW, height, depth), mat);
          leftStep.position.set(-(gapW + boxW) / 2, height / 2, sign * dist);
          leftStep.receiveShadow = true;
          leftStep.castShadow = true;
          group.add(leftStep);

          const rightStep = new THREE.Mesh(new THREE.BoxGeometry(boxW, height, depth), mat);
          rightStep.position.set((gapW + boxW) / 2, height / 2, sign * dist);
          rightStep.receiveShadow = true;
          rightStep.castShadow = true;
          group.add(rightStep);
        }
        
        // Add audience cubes on the stairs with staircase gaps (aisles)
        const numPeople = isSide 
          ? (isCyber ? 140 : 40 + Math.random() * 30) * 3
          : (isCyber ? 90 : 25 + Math.random() * 20) * 3;

        for (let p = 0; p < numPeople; p++) {
          const px = (Math.random() - 0.5) * (width - 1.5);
          
          // Do not spawn audience behind the goal nets (on both ends) to keep net area clean
          if (!isSide && Math.abs(px) < (GOAL_W / 2 + 3.0)) {
            continue;
          }

          // Create realistic aisles (stair gaps where spectators do not spawn)
          const aisleSpacing = isCyber ? 40.0 : 12.0;
          const modX = Math.abs(px) % aisleSpacing;
          if (modX < (isCyber ? 3.0 : 0.9)) {
            continue; // Skip spawning to simulate an aisle staircase
          }

          const person = new THREE.Mesh(audienceGeo, audienceMats[Math.floor(Math.random() * audienceMats.length)]);
          const py = height + (isCyber ? 0.5 : 0.25); 
          const pz = (Math.random() - 0.5) * (depth - (isCyber ? 0.6 : 0.3));
          
          if (isSide) {
            person.position.set(sign * dist + pz, py, px);
          } else {
            person.position.set(px, py, sign * dist + pz);
          }
          person.castShadow = true;
          group.add(person);
          audienceMembers.push({
            mesh: person,
            baseY: py,
            phaseOffset: Math.random() * Math.PI * 2,
            amplitude: isCyber ? 0.35 : 0.15 + Math.random() * 0.15,
            speed: 4.5 + Math.random() * 3.5
          });
        }
      }
      
      // Add heavy concrete buttresses (diagonal support pillars) behind the stands
      const buttressMat = isCyber 
        ? new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.15 })
        : new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, metalness: 0.1 });
      const buttressCount = isSide ? (isCyber ? 8 : 4) : (isCyber ? 6 : 3);
      
      for (let b = 0; b < buttressCount; b++) {
        const offset = ((b / (buttressCount - 1)) - 0.5) * (length - 6);
        const buttressW = isCyber ? 1.6 : 0.5;
        const buttressD = isCyber ? 4.8 : 1.6;
        
        const support = new THREE.Mesh(
          new THREE.BoxGeometry(buttressW, maxStandHeight, buttressD),
          buttressMat
        );
        
        const backXOrZ = sign * (startDist + maxStandDepth - buttressD / 2);
        
        if (isSide) {
          support.position.set(backXOrZ, maxStandHeight / 2, offset);
          support.castShadow = true;
          group.add(support);
        } else {
          if (Math.abs(offset) > (GOAL_W / 2 + 2.0)) {
            support.position.set(offset, maxStandHeight / 2, backXOrZ);
            support.castShadow = true;
            group.add(support);
          }
        }
      }

      // VIP Luxury Suites at the back of the side stands
      if (isSide) {
        const suiteLength = isCyber ? 36.0 : 10.0;
        const suiteWidth = isCyber ? 6.0 : 2.5;
        const suiteHeight = isCyber ? 4.8 : 1.8;
        const suiteY = maxStandHeight + suiteHeight / 2;
        const suiteZ = sign * (startDist + maxStandDepth - suiteWidth / 2);
        const suiteCount = isCyber ? 3 : 2;
        
        for (let s = 0; s < suiteCount; s++) {
          const sOffset = ((s / (suiteCount - 1)) - 0.5) * (length - (isCyber ? 50 : 15));
          
          const suiteGroup = new THREE.Group();
          
          // Solid dark frame
          const frame = new THREE.Mesh(
            new THREE.BoxGeometry(suiteLength, suiteHeight, suiteWidth),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
          );
          suiteGroup.add(frame);
          
          // Glowing glass suite window facing the field
          const windowW = suiteLength - 0.4;
          const windowH = suiteHeight - 0.4;
          const windowMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(windowW, windowH),
            new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
          );
          windowMesh.position.x = -sign * (suiteWidth / 2 + 0.02);
          windowMesh.rotation.y = Math.PI / 2;
          suiteGroup.add(windowMesh);
          
          // Ambient interior point light in each VIP cabin to make them look alive
          const suiteLight = new THREE.PointLight(0x00ffff, isCyber ? 2.5 : 1.0, isCyber ? 30 : 12);
          suiteLight.position.set(0, 0, 0);
          suiteGroup.add(suiteLight);
          
          suiteGroup.position.set(suiteZ, suiteY, sOffset);
          group.add(suiteGroup);
        }
      }
      
      // Add glowing LCD jumbotrons at the back of the end stands
      if (!isSide) {
        const lcdW = isCyber ? 48.0 : 12.0;
        const lcdH = isCyber ? 18.0 : 4.5;
        const lcdD = isCyber ? 1.2 : 0.4;
        
        const lcdBg = new THREE.Mesh(
          new THREE.BoxGeometry(lcdW, lcdH, lcdD),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        const lcdScreen = new THREE.Mesh(
          new THREE.PlaneGeometry(lcdW - 0.4, lcdH - 0.4),
          new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            map: lcdTexture,
            side: THREE.DoubleSide
          })
        );
        
        const y = maxStandHeight + lcdH / 2 + 0.5;
        const z = sign * (startDist + maxStandDepth - lcdD / 2);
        
        lcdBg.position.set(0, y, z);
        lcdScreen.position.set(0, y, z - sign * (lcdD / 2 + 0.02));
        if (sign > 0) lcdScreen.rotation.y = Math.PI;
        
        group.add(lcdBg, lcdScreen);

        // Neon frame around Jumbotron screen if in Cyber mode (amber/gold)
        if (isCyber) {
          const neonLcdColor = 0xffa500;
          const neonLcdMat = new THREE.MeshBasicMaterial({ color: neonLcdColor });
          const thick = 0.35;
          const trimTop = new THREE.Mesh(new THREE.BoxGeometry(lcdW, thick, thick), neonLcdMat);
          trimTop.position.set(0, y + lcdH / 2, z - sign * (lcdD / 2 + 0.04));
          const trimBot = new THREE.Mesh(new THREE.BoxGeometry(lcdW, thick, thick), neonLcdMat);
          trimBot.position.set(0, y - lcdH / 2, z - sign * (lcdD / 2 + 0.04));
          const trimL = new THREE.Mesh(new THREE.BoxGeometry(thick, lcdH, thick), neonLcdMat);
          trimL.position.set(-lcdW / 2, y, z - sign * (lcdD / 2 + 0.04));
          const trimR = new THREE.Mesh(new THREE.BoxGeometry(thick, lcdH, thick), neonLcdMat);
          trimR.position.set(lcdW / 2, y, z - sign * (lcdD / 2 + 0.04));
          group.add(trimTop, trimBot, trimL, trimR);
        }

        // Premium industrial steel truss columns behind each Jumbotron
        const trussMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.25, metalness: 0.82 });
        const colHeight = y + lcdH / 2;
        const colRadius = isCyber ? 0.45 : 0.15;
        const colXOffset = isCyber ? 18.0 : 4.5;

        for (const px of [-colXOffset, colXOffset]) {
          const supportCol = new THREE.Mesh(
            new THREE.CylinderGeometry(colRadius, colRadius, colHeight, 8),
            trussMat
          );
          // Rise from the ground to the top of the scoreboard
          supportCol.position.set(px, colHeight / 2, z);
          supportCol.castShadow = true;
          group.add(supportCol);
        }
        
        const crossBeam = new THREE.Mesh(
          new THREE.BoxGeometry(colXOffset * 2, isCyber ? 0.5 : 0.16, isCyber ? 0.5 : 0.16),
          trussMat
        );
        crossBeam.position.set(0, y, z + sign * (lcdD / 2 + 0.05));
        group.add(crossBeam);
      }
      return group;
    };

    arenaGroup.add(generateStands(false, -1)); // Red End
    arenaGroup.add(generateStands(false, 1));  // Blue End
    arenaGroup.add(generateStands(true, -1));  // Left Side
    arenaGroup.add(generateStands(true, 1));   // Right Side

    // --- DETAILED TEAM DUGOUTS (PLAYER BENCHES) ON THE LEFT SIDE OF THE FIELD ---
    const createDugout = (team: 'red' | 'blue') => {
      const dugoutGroup = new THREE.Group();
      const isRed = team === 'red';
      const colorHex = isRed ? 0xff3333 : 0x177dff;
      const zOffset = isRed ? -(isCyber ? 36.0 : 8.0) : (isCyber ? 36.0 : 8.0);
      
      const dw = isCyber ? 12.0 : 4.0;
      const dh = isCyber ? 3.5 : 1.2;
      const dd = isCyber ? 4.0 : 1.5;
      
      // Curved plastic/glass canopy shelter
      const canopyGeo = new THREE.CylinderGeometry(dd, dd, dw, 16, 1, true, -Math.PI / 2, Math.PI);
      const canopyMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.9,
        side: THREE.DoubleSide
      });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.rotation.x = Math.PI / 2;
      canopy.rotation.y = Math.PI / 2; // Orient along Z
      canopy.position.set(0, dh / 2, 0);
      dugoutGroup.add(canopy);
      
      // Side panels of the dugout
      const sidePanelGeo = new THREE.CircleGeometry(dd, 16, -Math.PI / 2, Math.PI);
      const sidePanelL = new THREE.Mesh(sidePanelGeo, canopyMat);
      sidePanelL.rotation.y = Math.PI / 2;
      sidePanelL.position.set(-dw / 2, dh / 2, 0);
      const sidePanelR = sidePanelL.clone();
      sidePanelR.position.x = dw / 2;
      dugoutGroup.add(sidePanelL, sidePanelR);
      
      // Floor / Base of dugout
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(dw, 0.08, dd * 2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
      );
      base.position.set(0, 0.04, 0);
      dugoutGroup.add(base);
      
      // Sports Seats inside the dugout
      const seatCount = 5;
      const seatW = dw / (seatCount + 1);
      const seatGeo = new THREE.BoxGeometry(seatW * 0.8, isCyber ? 0.8 : 0.25, isCyber ? 0.8 : 0.25);
      const seatBackGeo = new THREE.BoxGeometry(seatW * 0.8, isCyber ? 1.0 : 0.35, isCyber ? 0.15 : 0.05);
      const seatMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
      
      for (let s = 0; s < seatCount; s++) {
        const sx = -dw / 2 + (s + 1) * seatW;
        
        const seatBase = new THREE.Mesh(seatGeo, seatMat);
        seatBase.position.set(sx, isCyber ? 0.4 : 0.125, isCyber ? 0.3 : 0.1);
        
        const seatBack = new THREE.Mesh(seatBackGeo, seatMat);
        seatBack.position.set(sx, isCyber ? 1.1 : 0.35, isCyber ? -0.1 : -0.025);
        seatBack.rotation.x = 0.1; // slight tilt
        
        dugoutGroup.add(seatBase, seatBack);
      }
      
      // Position the dugout right outside the field border line
      dugoutGroup.position.set(-FIELD_W / 2 - (isCyber ? 2.5 : 0.8), 0, zOffset);
      arenaGroup.add(dugoutGroup);
    };

    createDugout('red');
    createDugout('blue');

    createClouds();
    buildStadiumLights();
    buildStadiumRoofs();
    buildCitySkyline();

    if (isCyber) {
      // Shoot majestic soft white volumetric sky-tracking beams up from the actual four corner light towers!
      const beamGeo = new THREE.CylinderGeometry(0.2, 6.0, 160, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xf2f8ff, // cool stadium-white sky beam
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const towersX = FIELD_W / 2 + 1.0;
      const towersZ = FIELD_L / 2 + 14.0;
      
      const beamPositions = [
        { x: -towersX, z: -towersZ },
        { x: towersX, z: -towersZ },
        { x: -towersX, z: towersZ },
        { x: towersX, z: towersZ }
      ];
      
      beamPositions.forEach(({ x, z }) => {
        const beam = new THREE.Mesh(beamGeo, beamMat);
        // Tilt the beams slightly outward for a majestic fan-out look
        beam.position.set(x * 1.08, 36 + 80, z * 1.08);
        beam.rotation.z = x > 0 ? 0.15 : -0.15;
        beam.rotation.x = z > 0 ? 0.15 : -0.15;
        arenaGroup.add(beam);
      });
    }
  }

  function createClouds() {
    if (isCyber) return;
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });
    
    for (let c = 0; c < 14; c++) {
      const singleCloud = new THREE.Group();
      const numSpheres = 3 + Math.floor(Math.random() * 4);
      for (let s = 0; s < numSpheres; s++) {
        const radius = 2.5 + Math.random() * 2.8;
        const sphereGeo = new THREE.SphereGeometry(radius, 7, 7);
        const sphere = new THREE.Mesh(sphereGeo, cloudMat);
        sphere.position.set(
          (Math.random() - 0.5) * 4.5,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 4.5
        );
        singleCloud.add(sphere);
      }
      
      const cx = (Math.random() - 0.5) * 140;
      const cy = 26 + Math.random() * 12;
      const cz = (Math.random() - 0.5) * 160;
      
      singleCloud.position.set(cx, cy, cz);
      cloudGroup.add(singleCloud);
    }
    arenaGroup.add(cloudGroup);
  }

  function buildCitySkyline() {
    const cityGroup = new THREE.Group();
    
    const startRadius = isCyber ? 230 : 65;
    const endRadius = isCyber ? 480 : 160;
    const numBuildings = isCyber ? 120 : 60;
    
    const textureLoader = new THREE.TextureLoader();
    const buildingSkins = [
      textureLoader.load('/building1.png'),
      textureLoader.load('/building2.png'),
      textureLoader.load('/building3.png'),
      textureLoader.load('/building4.png')
    ];

    buildingSkins.forEach(tex => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    });

    for (let i = 0; i < numBuildings; i++) {
      const angle = (i / numBuildings) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI * 2 / numBuildings);
      const radius = startRadius + Math.random() * (endRadius - startRadius);
      
      const bx = Math.cos(angle) * radius;
      const bz = Math.sin(angle) * radius;
      
      const bw = isCyber ? 24 + Math.random() * 26 : 8 + Math.random() * 12;
      const bd = isCyber ? 24 + Math.random() * 26 : 8 + Math.random() * 12;
      const bh = isCyber ? 90 + Math.random() * 150 : 25 + Math.random() * 50;
      
      const building = new THREE.Group();
      
      // Select a random skin
      const skinTex = buildingSkins[Math.floor(Math.random() * buildingSkins.length)].clone();
      skinTex.repeat.set(Math.round(bw / 8), Math.round(bh / 15));
      skinTex.needsUpdate = true;

      // Building core with the new skin
      const coreGeo = new THREE.BoxGeometry(bw, bh, bd);
      const coreMat = new THREE.MeshStandardMaterial({
        map: skinTex,
        roughness: 0.4,
        metalness: 0.5,
        emissive: isCyber ? 0x111111 : 0x000000,
        emissiveMap: skinTex,
        emissiveIntensity: isCyber ? 0.8 : 0.2
      });
      
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = bh / 2;
      building.add(core);
      
      // Add roof structures
      if (isCyber) {
        // High-tech antennas, glowing pillars, spires
        if (Math.random() > 0.3) {
          const spireH = 15 + Math.random() * 30;
          const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, spireH, 4);
          const spireMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x00f2ff : 0xff00bb });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.set(0, bh + spireH / 2, 0);
          building.add(spire);
          
          // Red warning blinking light at top
          const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
          const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(0, bh + spireH, 0);
          building.add(beacon);
        }
        
        // Roof trim neon glow
        if (Math.random() > 0.5) {
          const neonColor = Math.random() > 0.5 ? 0x00ffff : 0xff00ff;
          const trimGeo = new THREE.BoxGeometry(bw + 0.4, 1.5, bd + 0.4);
          const trimMat = new THREE.MeshBasicMaterial({ color: neonColor });
          const trim = new THREE.Mesh(trimGeo, trimMat);
          trim.position.set(0, bh - 0.75, 0);
          building.add(trim);
        }
      } else {
        // Classic roofs
        if (Math.random() > 0.4) {
          // Water tank
          const tankGeo = new THREE.CylinderGeometry(bw * 0.2, bw * 0.2, bh * 0.08, 8);
          const tankMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
          const tank = new THREE.Mesh(tankGeo, tankMat);
          tank.position.set((Math.random() - 0.5) * bw * 0.4, bh + (bh * 0.04), (Math.random() - 0.5) * bd * 0.4);
          building.add(tank);
        }
        
        if (Math.random() > 0.6) {
          // Metal spire
          const spireH = 8 + Math.random() * 15;
          const spireGeo = new THREE.CylinderGeometry(0.05, 0.2, spireH, 4);
          const spireMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.set(0, bh + spireH / 2, 0);
          building.add(spire);
          
          // Red beacon on top
          const beaconGeo = new THREE.SphereGeometry(0.35, 8, 8);
          const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(0, bh + spireH, 0);
          building.add(beacon);
        }
      }
      
      building.position.set(bx, 0, bz);
      cityGroup.add(building);
    }
    
    arenaGroup.add(cityGroup);
  }

  function buildStadiumLights() {
    const lightGroup = new THREE.Group();
    
    const mastMat = isCyber
      ? new THREE.MeshStandardMaterial({
          color: 0x08060c,
          roughness: 0.1,
          metalness: 0.9
        })
      : new THREE.MeshStandardMaterial({
          color: 0xe5e7eb,
          roughness: 0.18,
          metalness: 0.75
        });
    
    const panelMat = isCyber
      ? new THREE.MeshStandardMaterial({
          color: 0x0a0812,
          roughness: 0.15,
          metalness: 0.95
        })
      : new THREE.MeshStandardMaterial({
          color: 0x1f2937,
          roughness: 0.45,
          metalness: 0.1
        });
    
    const bulbMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    
    // Repositioned dynamically to the true outer corners of the stands
    const cornerPositions = [
      { x: -(FIELD_W / 2 + 1.0), z: -(FIELD_L / 2 + 14.0), rotY: Math.PI / 4 },
      { x: (FIELD_W / 2 + 1.0), z: -(FIELD_L / 2 + 14.0), rotY: -Math.PI / 4 },
      { x: -(FIELD_W / 2 + 1.0), z: (FIELD_L / 2 + 14.0), rotY: 3 * Math.PI / 4 },
      { x: (FIELD_W / 2 + 1.0), z: (FIELD_L / 2 + 14.0), rotY: -3 * Math.PI / 4 }
    ];
    
    cornerPositions.forEach(({ x, z, rotY }) => {
      const tower = new THREE.Group();
      tower.position.set(x, 0, z);
      tower.rotation.y = rotY;
      
      const towerBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      
      // Increased mast height to 36.0 to tower majestically over the newly raised stadium roofs
      const mastHeight = 36.0;
      const mastGeo = new THREE.CylinderGeometry(0.24, 0.76, mastHeight, 12);
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = mastHeight / 2;
      // Lean inwards elegantly over the roofs towards the pitch
      mast.rotation.z = x > 0 ? 0.12 : -0.12;
      mast.rotation.x = z > 0 ? -0.12 : 0.12;
      mast.castShadow = true;
      tower.add(mast);
      
      const headY = mastHeight;
      const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.6, 0.5), panelMat);
      panelFrame.position.set(0, headY, 0);
      panelFrame.rotation.x = 0.45;
      tower.add(panelFrame);
      
      const bulbGeo = new THREE.CylinderGeometry(0.64, 0.64, 0.2, 16);
      bulbGeo.rotateX(Math.PI / 2);
      
      const bulbRows = 2;
      const bulbCols = 3;
      for (let r = 0; r < bulbRows; r++) {
        for (let c = 0; c < bulbCols; c++) {
          const bulb = new THREE.Mesh(bulbGeo, towerBulbMat);
          const bx = (c - 1) * 2.2;
          const by = headY + (r - 0.5) * 1.4;
          bulb.position.set(bx, by, 0.25);
          bulb.rotation.x = 0.45;
          tower.add(bulb);
        }
      }
      
      // Extended distance to 240.0 so the lights completely span the field and illuminate cars/ball
      const spotColor = isCyber ? 0xf2f8ff : 0xfff8f0;
      const spotLight = new THREE.SpotLight(spotColor, isCyber ? 9.5 : 4.0, 240, Math.PI / 3, 0.5, 1);
      spotLight.position.set(0, headY, 0.4);
      spotLight.castShadow = false;
      
      const targetObj = new THREE.Object3D();
      targetObj.position.set(-x * 0.45, 0, -z * 0.45);
      scene.add(targetObj);
      spotLight.target = targetObj;
      
      tower.add(spotLight);
      lightGroup.add(tower);
    });
    
    arenaGroup.add(lightGroup);
  }

  function buildStadiumRoofs() {
    const roofGroup = new THREE.Group();
    const stepCount = isCyber ? 18 : 9;
    const stepDepth = isCyber ? 2.4 : 1.2;
    
    const structureMat = isCyber
      ? new THREE.MeshStandardMaterial({
          color: 0x64748b, // slate metallic steel
          roughness: 0.2,
          metalness: 0.9
        })
      : new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.3,
          metalness: 0.85
        });
    
    const panelMat = isCyber
      ? new THREE.MeshStandardMaterial({
          color: 0xd8e2ed, // frosted glass-silver sheet
          roughness: 0.15,
          metalness: 0.8,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide
        })
      : new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.4,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide
        });

    const trimColorMat = isCyber
      ? new THREE.MeshStandardMaterial({
          color: 0xffa500, // Golden-amber neon glow
          emissive: 0xffa500,
          emissiveIntensity: 1.5
        })
      : new THREE.MeshStandardMaterial({
          color: 0x177dff,
          emissive: 0x0a4da2,
          emissiveIntensity: 0.8
        });

    const sides = [
      { isSide: true, sign: -1 },
      { isSide: true, sign: 1 },
      { isSide: false, sign: -1 },
      { isSide: false, sign: 1 }
    ];

    sides.forEach(({ isSide, sign }) => {
      const length = isSide ? FIELD_L + 2 : FIELD_W + 18;
      const startDist = isSide ? FIELD_W / 2 + 0.8 : FIELD_L / 2 + 1.2;
      const backDist = startDist + stepCount * stepDepth;
      
      const roofWidth = length;
      const roofDepth = isCyber ? 42.0 : 13.5; 
      const roofHeight = isCyber ? 36.0 : 13.0; 
      const centerDist = backDist - roofDepth / 2;

      const roofPanel = new THREE.Mesh(
        isSide 
          ? new THREE.BoxGeometry(roofDepth, isCyber ? 0.8 : 0.25, roofWidth)
          : new THREE.BoxGeometry(roofWidth, isCyber ? 0.8 : 0.25, roofDepth),
        panelMat
      );

      if (isSide) {
        roofPanel.position.set(sign * centerDist, roofHeight, 0);
        roofPanel.rotation.z = -sign * 0.08;
      } else {
        roofPanel.position.set(0, roofHeight, sign * centerDist);
        roofPanel.rotation.x = sign * 0.08;
      }
      roofGroup.add(roofPanel);

      // Use 4 pillars for end stands (isSide === false) so that no pillar is constructed in the center (offset === 0)
      const numPillars = isSide ? Math.max(3, Math.floor(length / (isCyber ? 24.0 : 8.5))) : 4;
      for (let p = 0; p < numPillars; p++) {
        const offset = (numPillars > 1) ? ((p / (numPillars - 1)) - 0.5) * (length - 4) : 0;

        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(isCyber ? 0.45 : 0.18, isCyber ? 0.65 : 0.28, roofHeight, 8),
          structureMat
        );
        
        const girder = new THREE.Mesh(
          isSide
            ? new THREE.BoxGeometry(roofDepth - 1.0, isCyber ? 0.45 : 0.16, isCyber ? 0.45 : 0.16)
            : new THREE.BoxGeometry(isCyber ? 0.45 : 0.16, isCyber ? 0.45 : 0.16, roofDepth - 1.0),
          structureMat
        );

        const diagonalLength = isCyber ? 18.0 : 5.5;
        const strut = new THREE.Mesh(
          isSide
            ? new THREE.BoxGeometry(diagonalLength, isCyber ? 0.35 : 0.12, isCyber ? 0.35 : 0.12)
            : new THREE.BoxGeometry(isCyber ? 0.35 : 0.12, isCyber ? 0.35 : 0.12, diagonalLength),
          structureMat
        );

        if (isSide) {
          pillar.position.set(sign * backDist, roofHeight / 2, offset);
          
          girder.position.set(sign * (backDist - (roofDepth - 1.0) / 2), roofHeight + (isCyber ? 0.8 : 0.35), offset);
          girder.rotation.z = -sign * 0.1;

          strut.position.set(sign * (backDist - (isCyber ? 7.2 : 2.2)), roofHeight - (isCyber ? 4.2 : 1.3), offset);
          strut.rotation.z = -sign * 0.52;
        } else {
          pillar.position.set(offset, roofHeight / 2, sign * backDist);

          girder.position.set(offset, roofHeight + (isCyber ? 0.8 : 0.35), sign * (backDist - (roofDepth - 1.0) / 2));
          girder.rotation.x = sign * 0.1;

          strut.position.set(offset, roofHeight - (isCyber ? 4.2 : 1.3), sign * (backDist - (isCyber ? 7.2 : 2.2)));
          strut.rotation.x = sign * 0.52;
        }

        roofGroup.add(pillar, girder, strut);
      }

      const innerEdgeDist = backDist - roofDepth + 0.15;
      const trim = new THREE.Mesh(
        isSide
          ? new THREE.BoxGeometry(isCyber ? 0.45 : 0.15, isCyber ? 0.45 : 0.15, roofWidth)
          : new THREE.BoxGeometry(roofWidth, isCyber ? 0.45 : 0.15, isCyber ? 0.45 : 0.15),
        trimColorMat
      );

      if (isSide) {
        trim.position.set(sign * innerEdgeDist, roofHeight - (roofDepth * 0.08), 0);
      } else {
        trim.position.set(0, roofHeight - (roofDepth * 0.08), sign * innerEdgeDist);
      }
      roofGroup.add(trim);

      // --- ULTRA PREMIUM INTEGRATED ROOF FLOODLIGHT FIXTURES ---
      // Adds a gorgeous row of glowing LED light boxes pointing down at the pitch!
      const numLights = isCyber ? (isSide ? 12 : 8) : (isSide ? 6 : 4);
      const bulbGeo = isCyber ? new THREE.BoxGeometry(2.0, 1.0, 1.5) : new THREE.BoxGeometry(0.6, 0.3, 0.45);
      const bulbLensGeo = isCyber ? new THREE.BoxGeometry(1.8, 0.15, 1.3) : new THREE.BoxGeometry(0.52, 0.05, 0.38);
      const lightBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });

      for (let l = 0; l < numLights; l++) {
        const pct = numLights > 1 ? (l / (numLights - 1)) - 0.5 : 0;
        const posOnEdge = pct * (roofWidth * 0.82);

        const lightFixture = new THREE.Group();
        const boxMesh = new THREE.Mesh(bulbGeo, lightBoxMat);
        const lensMesh = new THREE.Mesh(bulbLensGeo, lightBulbMat);
        lensMesh.position.y = isCyber ? -0.45 : -0.13; // place glowing lens at the bottom of the casing
        lightFixture.add(boxMesh, lensMesh);

        // Position on the roof's inner edge, tilting down towards the pitch
        const edgeY = roofHeight - (roofDepth * 0.08) - (isCyber ? 0.72 : 0.22);
        if (isSide) {
          lightFixture.position.set(sign * innerEdgeDist, edgeY, posOnEdge);
          lightFixture.rotation.z = -sign * 0.42; // angle inwards
        } else {
          lightFixture.position.set(posOnEdge, edgeY, sign * innerEdgeDist);
          lightFixture.rotation.x = sign * 0.42; // angle inwards
        }

        // Add actual glowing light emitters under the fixtures for premium side lighting!
        if (l % 2 === 0) {
          const lightColor = isCyber ? 0xf2f8ff : 0xfffaed;
          const pointL = new THREE.PointLight(lightColor, isCyber ? 6.5 : 1.2, isCyber ? 120 : 45, 1.2);
          pointL.position.set(0, isCyber ? -0.5 : -0.2, 0);
          lightFixture.add(pointL);
        }

        roofGroup.add(lightFixture);
      }
    });

    arenaGroup.add(roofGroup);
  }

  function createBoostPads() {
    const positions = [
      [-35.2, -56], [35.2, -56], [-35.2, 56], [35.2, 56],
      [-40.8, 0], [40.8, 0], [0, -36], [0, 36],
      // Corner mega boost pads
      [-42.0, -72.0], [42.0, -72.0], [-42.0, 72.0], [42.0, 72.0]
    ];
    const padMat = new THREE.MeshStandardMaterial({ color: 0xffd32a, emissive: 0xff8a00, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.62 });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.44, depthWrite: false });
    for (const [x, z] of positions) {
      const group = new THREE.Group();
      const core = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.64, 0.32, 24), padMat.clone());
      core.position.y = 0.15;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.84, 0.07, 8, 28), ringMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.29;
      group.add(core, ring);
      group.position.set(x, 0, z);
      group.name = "boost_pad";
      scene.add(group);
      pads.push({ mesh: group, core, x, z, cooldown: 0 });
    }
  }

  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 28; i += 1) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), sparkMat.clone());
    mesh.visible = false;
    scene.add(mesh);
    sparks.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1 });
  }

  function resetKickoff(scoredBy: GoalSide | null) {
    const carStartOffset = isCyber ? 14 : 3.5;
    const extraCarStartOffset = isCyber ? 12 : 3.0;

    player.x = 0;
    player.y = CAR_Y;
    player.z = FIELD_L / 2 - carStartOffset;
    player.vx = 0;
    player.vy = 0;
    player.vz = 0;
    player.yaw = Math.PI;
    player.boost = Math.max(player.boost, 52);
    if (carOptions?.matchMode === 'practice') {
      ai.x = 9999;
      ai.y = -9999;
      ai.z = 9999;
      ai.vx = 0;
      ai.vy = 0;
      ai.vz = 0;
      ai.yaw = 0;
    } else {
      ai.x = 0;
      ai.y = CAR_Y;
      ai.z = -FIELD_L / 2 + carStartOffset;
      ai.vx = 0;
      ai.vy = 0;
      ai.vz = 0;
      ai.yaw = 0;
      ai.boost = Math.max(ai.boost, 55);
    }
    for (let i=0; i<extraCars.length; i++) {
      const c = extraCars[i];
      const isAlly = c.id.startsWith("ally");
      const idx = isAlly ? Math.floor(i/2) : Math.floor((i-1)/2);
      c.x = idx === 0 ? -extraCarStartOffset : extraCarStartOffset;
      c.y = CAR_Y;
      c.z = isAlly ? FIELD_L / 2 - carStartOffset : -FIELD_L / 2 + carStartOffset;
      c.vx = 0; c.vy = 0; c.vz = 0;
      c.yaw = isAlly ? Math.PI : 0;
      c.boost = Math.max(c.boost, 55);
    }
    ball.x = 0;
    ball.z = 0;
    ball.vx = scoredBy === "player" ? 0.45 : scoredBy === "ai" ? -0.45 : 0;
    ball.vz = 0;
    run.kickoff = isFirstKickoff ? 5.8 : 1.25;
    run.aiDelay = scoredBy ? 0.8 : 1.0;
  }

  function showToast(message: string, seconds = 1.35) {
    run.toast = message;
    run.toastTime = seconds;
    if (toastEl) {
      toastEl.textContent = message;
      toastEl.classList.add("show");
    }
  }

  function emitSparks(x: number, y: number, z: number, dx: number, dz: number, color: number) {
    for (let i = 0; i < sparks.length; i += 1) {
      const spark = sparks[i];
      const a = i * 2.399 + dx * 0.3 + dz * 0.2;
      const speed = 4.0 + ((i * 37) % 9) * 0.42;
      spark.mesh.visible = true;
      spark.mesh.position.set(x, y, z);
      const mat = spark.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity = 1;
      spark.vx = Math.cos(a) * speed + dx * 0.12;
      spark.vz = Math.sin(a) * speed + dz * 0.12;
      spark.vy = 1.6 + (i % 5) * 0.42;
      spark.life = 0.36 + (i % 7) * 0.025;
      spark.maxLife = spark.life;
    }
  }

  function updateCar(car: Car, dt: number, steer: number, throttle: number, boosting: boolean, jumpPressed: boolean, handlingMul = 1) {
    const turnRate = 3.5 * handlingMul;
    const accel = 40 * handlingMul;
    const maxSpeed = 35 * handlingMul;
    const boostForce = 64 * handlingMul;
    const jumpImpulse = 11.2;
    const speed = len2(car.vx, car.vz);
    
    let fx = Math.sin(car.yaw);
    let fz = Math.cos(car.yaw);
    let rx = Math.cos(car.yaw);
    let rz = -Math.sin(car.yaw);
    let forwardSpeed = car.vx * fx + car.vz * fz;
    
    if (car.onGround) {
      const moveDir = Math.abs(forwardSpeed) > 1.0 ? Math.sign(forwardSpeed) : (throttle !== 0 ? Math.sign(throttle) : 1);
      const speedFactor = clamp(speed / 8.0, 0, 1);
      const steerFactor = speedFactor * (1.0 - clamp((speed - 15) / 30, 0, 0.4));
      car.yaw -= steer * turnRate * steerFactor * moveDir * dt;
    }
    
    fx = Math.sin(car.yaw);
    fz = Math.cos(car.yaw);
    rx = Math.cos(car.yaw);
    rz = -Math.sin(car.yaw);
    forwardSpeed = car.vx * fx + car.vz * fz;
    const sideSpeed = car.vx * rx + car.vz * rz;
    
    if (car.onGround) {
      let newForwardSpeed = forwardSpeed + throttle * accel * dt;
      
      if (throttle < -0.1 && newForwardSpeed > 1) {
        newForwardSpeed -= 40 * dt;
      }
      
      const drag = (throttle === 0) ? 3.0 : 0.4;
      newForwardSpeed *= Math.exp(-drag * dt);
      
      const grip = 35.0; // high grip for tight car feel
      const newSideSpeed = sideSpeed * Math.exp(-grip * dt);
      
      car.vx = fx * newForwardSpeed + rx * newSideSpeed;
      car.vz = fz * newForwardSpeed + rz * newSideSpeed;
    } else {
      car.vx *= Math.exp(-0.1 * dt);
      car.vz *= Math.exp(-0.1 * dt);
    }
    
    if (boosting && car.boost > 0 && throttle > -0.2) {
      car.vx += fx * boostForce * dt;
      car.vz += fz * boostForce * dt;
      car.boost = Math.max(0, car.boost - 34 * dt);
    } else {
      car.boost = Math.min(100, car.boost + 3.5 * dt);
    }
    
    const afterSpeed = len2(car.vx, car.vz);
    const limit = maxSpeed + (boosting ? 12 : 0);
    if (afterSpeed > limit) {
      car.vx = (car.vx / afterSpeed) * limit;
      car.vz = (car.vz / afterSpeed) * limit;
    }
    
    if (jumpPressed && !car.jumpLatch && car.onGround) {
      car.vy = jumpImpulse;
      car.onGround = false;
      car.punch = 0.2;
    }
    car.jumpLatch = jumpPressed;
    car.vy -= 18.5 * dt;
    car.y += car.vy * dt;
    
    if (car.y <= CAR_Y) {
      car.y = CAR_Y;
      car.vy = 0;
      car.onGround = true;
    }
    
    car.x += car.vx * dt;
    car.z += car.vz * dt;
    keepCarInArena(car);
    if (car.onGround) {
      const wheelSpin = len2(car.vx, car.vz) * dt * 7.5;
      for (const wheel of car.wheels) wheel.rotation.x += wheelSpin * (forwardSpeed >= 0 ? 1 : -1);
    }
  }

  function keepCarInArena(car: Car) {
    const halfL = 0.9;
    const halfW = 0.45;
    const extentX = Math.abs(Math.sin(car.yaw) * halfL) + Math.abs(Math.cos(car.yaw) * halfW);
    const extentZ = Math.abs(Math.cos(car.yaw) * halfL) + Math.abs(Math.sin(car.yaw) * halfW);

    const maxX = FIELD_W / 2 - extentX;
    const maxZ = FIELD_L / 2 - extentZ;
    if (car.x < -maxX) {
      car.x = -maxX;
      car.vx = Math.abs(car.vx) * 0.25;
    } else if (car.x > maxX) {
      car.x = maxX;
      car.vx = -Math.abs(car.vx) * 0.25;
    }
    if (car.z < -maxZ) {
      car.z = -maxZ;
      car.vz = Math.abs(car.vz) * 0.25;
    } else if (car.z > maxZ) {
      car.z = maxZ;
      car.vz = -Math.abs(car.vz) * 0.25;
    }
  }

  function updateAi(car: Car, dt: number, isAlly: boolean) {
    if (carOptions?.matchMode === 'practice') {
      car.x = 9999;
      car.y = -9999;
      car.z = 9999;
      car.vx = 0;
      car.vy = 0;
      car.vz = 0;
      return;
    }
    if (run.kickoff > 0) {
      updateCar(car, dt, 0, 0, false, false, 0.8);
      return;
    }
    if (run.aiDelay > 0 && !isAlly) { // only main AI gets delay maybe?
      run.aiDelay -= dt;
      updateCar(car, dt, 0, 0, false, false, 0.8);
      return;
    }
    const minuteRamp = clamp((300 - run.timeLeft) / 260, 0, 1);
    const aiMul = 0.82 + minuteRamp * 0.25 + run.playerGoals * 0.035;
    const targetGoalZ = isAlly ? -FIELD_L / 2 : FIELD_L / 2;
    const behind = isAlly ? (ball.z < car.z ? 2.4 : -2.2) : (ball.z > car.z ? -2.4 : 2.2);
    const targetX = clamp(ball.x * 0.86, -FIELD_W / 2 + 2, FIELD_W / 2 - 2);
    const targetZ = clamp(ball.z + behind, -FIELD_L / 2 + 3, FIELD_L / 2 - 3);
    const dx = targetX - car.x;
    const dz = targetZ - car.z;
    const desiredYaw = Math.atan2(dx, dz);
    const steer = clamp(-angleDiff(desiredYaw, car.yaw) * 1.8, -1, 1);
    const dist = len2(dx, dz);
    const aligned = Math.abs(angleDiff(desiredYaw, car.yaw)) < 0.45;
    const throttle = dist > 1.3 ? 1 : 0.35;
    const ballDist = len2(ball.x - car.x, ball.z - car.z);
    const boost = aligned && ballDist < 9 && car.boost > 14 && ((isAlly ? ball.z > -6 : ball.z < 6) || run.timeLeft < 45) && run.kickoff <= 0;
    
    // Only set visual for main ai if we want, or handle boost visually in updateCar
    // aiBoostVisual is global. Let's ignore it for extra cars or let updateCar handle it.
    if (car === ai) aiBoostVisual = boost;
    
    const jump = ballDist < 2.1 && ball.y > 1.2 && car.onGround;
    updateCar(car, dt, steer, throttle, boost, jump, aiMul);
    
    // push car slightly if it's going for goal
    if (ballDist < 2.4 && (isAlly ? ball.z > car.z : ball.z < car.z) && (isAlly ? targetGoalZ < ball.z : targetGoalZ > ball.z)) {
      car.vx += (ball.x > car.x ? 1 : -1) * 0.08;
    }
  }

  let wallCueCooldown = 0;
  function wallThump() {
    if (wallCueCooldown <= 0) {
      wallCueCooldown = 0.22;
    }
  }

  function updateBall(dt: number) {
    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;
    ball.vx *= Math.exp(-0.28 * dt);
    ball.vz *= Math.exp(-0.28 * dt);
    const halfW = FIELD_W / 2 - BALL_RADIUS;
    const halfL = FIELD_L / 2 - BALL_RADIUS;
    if (ball.x < -halfW) {
      ball.x = -halfW;
      ball.vx = Math.abs(ball.vx) * 0.86;
      wallThump();
    } else if (ball.x > halfW) {
      ball.x = halfW;
      ball.vx = -Math.abs(ball.vx) * 0.86;
      wallThump();
    }
    const inGoalMouth = Math.abs(ball.x) < GOAL_W / 2;
    if (!inGoalMouth) {
      if (ball.z < -halfL) {
        ball.z = -halfL;
        ball.vz = Math.abs(ball.vz) * 0.9;
        wallThump();
      } else if (ball.z > halfL) {
        ball.z = halfL;
        ball.vz = -Math.abs(ball.vz) * 0.9;
        wallThump();
      }
    }
    ball.lastSpeed = len2(ball.vx, ball.vz);
    ball.spinX += ball.vz * dt / BALL_RADIUS;
    ball.spinZ -= ball.vx * dt / BALL_RADIUS;
  }

  function collideCarBall(car: Car, isPlayer: boolean) {
    const dx = ball.x - car.x;
    const dz = ball.z - car.z;
    const dist = Math.max(0.001, len2(dx, dz));
    const minDist = BALL_RADIUS + car.radius;
    if (dist >= minDist) return;
    const nx = dx / dist;
    const nz = dz / dist;
    const overlap = minDist - dist;
    ball.x += nx * overlap * 0.78;
    ball.z += nz * overlap * 0.78;
    car.x -= nx * overlap * 0.18;
    car.z -= nz * overlap * 0.18;
    const relVx = car.vx - ball.vx;
    const relVz = car.vz - ball.vz;
    const toward = Math.max(0, relVx * nx + relVz * nz);
    const impulse = 8.5 + toward * 1.22 + (car.y > CAR_Y + 0.55 ? 3.5 : 0);
    ball.vx += nx * impulse + car.vx * 0.16;
    ball.vz += nz * impulse + car.vz * 0.16;
    car.vx -= nx * impulse * 0.04;
    car.vz -= nz * impulse * 0.04;
    car.punch = 0.24;
    ballHitThisFrame = true;
    emitSparks(ball.x - nx * BALL_RADIUS * 0.72, 1.0, ball.z - nz * BALL_RADIUS * 0.72, ball.vx, ball.vz, isPlayer ? 0x62f5ff : 0xffbf34);
    if (isPlayer) {
      run.shots += 1;
      if (!run.firstHit) {
        run.firstHit = true;
        run.firstHitSpeed = len2(ball.vx, ball.vz);
        showToast("FIRST THUMP!", 1.1);
      }
    }
  }

  function checkPads(dt: number) {
    for (const pad of pads) {
      if (pad.cooldown > 0) pad.cooldown = Math.max(0, pad.cooldown - dt);
      const active = pad.cooldown <= 0;
      const dist = len2(player.x - pad.x, player.z - pad.z);
      if (active && dist < 1.65 && player.boost < 98) {
        player.boost = Math.min(100, player.boost + 38);
        pad.cooldown = 5;
        showToast("BOOST PAD +38", 0.85);
      }
      const aiDist = len2(ai.x - pad.x, ai.z - pad.z);
      if (active && aiDist < 1.5 && ai.boost < 90) {
        ai.boost = Math.min(100, ai.boost + 30);
        pad.cooldown = 5;
      }
    }
  }

  function scoreGoal(side: GoalSide) {
    if (run.kickoff > 0 || phase !== "playing") return;
    run.lastGoal = side;
    goalBannerTimer = 3.5;
    goalBannerScorer = side;
    if (side === "player") {
      run.playerGoals += 1;
      showToast("GOAL!", 1.6);
      goalGlowB.intensity = 4.8;
    } else {
      run.aiGoals += 1;
      showToast("AI GOAL", 1.6);
      goalGlowA.intensity = 4.8;
    }
    emitSparks(0, 1.2, side === "player" ? -FIELD_L / 2 : FIELD_L / 2, 0, side === "player" ? -16 : 16, side === "player" ? 0x66f5ff : 0xff4040);
    
    if (run.overtime) {
      beginResolving(side === "player" ? "Sudden-death winner!" : "AI stole sudden death");
    } else {
      phase = "replay";
      replayPlaybackIndex = 0;

      // Select replay frames: start from the last ball hit, plus a buffer of 25 frames (approx 0.4s) before the hit
      let lastHitIdx = -1;
      for (let i = replayBuffer.length - 1; i >= 0; i--) {
        if (replayBuffer[i].isHit) {
          lastHitIdx = i;
          break;
        }
      }

      if (lastHitIdx !== -1) {
        const startIdx = Math.max(0, lastHitIdx - 25);
        replayActiveFrames = replayBuffer.slice(startIdx);
      } else {
        // Fallback: use last 120 frames (~2 seconds)
        const startIdx = Math.max(0, replayBuffer.length - 120);
        replayActiveFrames = replayBuffer.slice(startIdx);
      }

      if (replayActiveFrames.length === 0) {
        phase = "playing";
        if (replayOverlay) replayOverlay.style.display = "none";
        resetKickoff(side);
      } else {
        if (replayOverlay) {
          replayOverlay.style.display = "flex";
        }
      }
    }
  }

  function beginResolving(cause: string) {
    if (phase === "resolving" || phase === "submitted") return;
    phase = "resolving";
    const win = run.playerGoals > run.aiGoals;
    if (resolveEl && resultTitleEl && resultSubEl) {
      resultTitleEl.textContent = win ? "FINAL WHISTLE — YOU WIN" : "FINAL WHISTLE — AI WINS";
      resultSubEl.textContent = `${cause}  ${run.playerGoals}-${run.aiGoals}`;
      resolveEl.classList.remove("hidden");
    }
    
    setTimeout(() => {
      if (submitted) return;
      submitted = true;
      phase = "submitted";
      // Game over logic would go here
    }, 2000);
  }

  function update(dtRaw: number) {
    if (phase !== "playing") return;
    ballHitThisFrame = false; // Reset hit flag for the frame
    const dt = Math.min(0.033, dtRaw);
    wallCueCooldown = Math.max(0, wallCueCooldown - dt);
    goalGlowA.intensity += (1.3 - goalGlowA.intensity) * (1 - Math.exp(-4 * dt));
    goalGlowB.intensity += (1.3 - goalGlowB.intensity) * (1 - Math.exp(-4 * dt));
    
    if (run.kickoff > 0) {
      run.kickoff = Math.max(0, run.kickoff - dt);
      if (run.kickoff <= 0) {
        showToast("START!", 1.2);
        isFirstKickoff = false;
      } else if (isFirstKickoff && run.kickoff > 3.0) {
        showToast("READY...", 0.2);
      } else {
        const ceilSec = Math.ceil(run.kickoff);
        showToast(`${ceilSec}...`, 0.2);
      }
    }

    if (!run.overtime) {
      run.timeLeft = Math.max(0, run.timeLeft - dt);
      if (run.timeLeft <= 0) {
        if (run.playerGoals === run.aiGoals) {
          run.overtime = true;
          showToast("SUDDEN DEATH", 1.8);
        } else {
          beginResolving("Time expired");
        }
      }
    }

    const steer = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
    // Lock controls during kickoff countdown
    const throttle = (run.kickoff > 0) ? 0 : ((keys.arrowup || keys.w ? 1 : 0) - (keys.arrowdown || keys.s ? 1 : 0));
    const boostDown = (run.kickoff > 0) ? false : Boolean(keys.shift || keys.enter);
    const jumpDown = (run.kickoff > 0) ? false : Boolean(keys.space);

    playerBoostVisual = boostDown && player.boost > 0;
    
    updateCar(player, dt, steer, throttle, boostDown, jumpDown, 1);
    updateAi(ai, dt, false);
    for (const c of extraCars) {
      updateAi(c, dt, c.id.startsWith("ally"));
    }
    updateBall(dt);
    collideCarBall(player, true);
    collideCarBall(ai, false);
    for (const c of extraCars) {
      collideCarBall(c, c.id.startsWith("ally"));
    }
    
    // Car-to-Car collision
    const allPlayableCars = [player, ai, ...extraCars];
    for (let i = 0; i < allPlayableCars.length; i++) {
      for (let j = i + 1; j < allPlayableCars.length; j++) {
        const c1 = allPlayableCars[i];
        const c2 = allPlayableCars[j];
        const cdx = c2.x - c1.x;
        const cdz = c2.z - c1.z;
        const cdist = Math.max(0.001, Math.sqrt(cdx*cdx + cdz*cdz));
        const cMinDist = c1.radius + c2.radius;
        if (cdist < cMinDist) {
          const cnx = cdx / cdist;
          const cnz = cdz / cdist;
          const coverlap = cMinDist - cdist;
          c1.x -= cnx * coverlap * 0.5;
          c1.z -= cnz * coverlap * 0.5;
          c2.x += cnx * coverlap * 0.5;
          c2.z += cnz * coverlap * 0.5;
          keepCarInArena(c1);
          keepCarInArena(c2);
          const crelVx = c2.vx - c1.vx;
          const crelVz = c2.vz - c1.vz;
          const ctoward = crelVx * cnx + crelVz * cnz;
          if (ctoward < 0) {
            const cimpulse = -ctoward * 0.6;
            c1.vx -= cnx * cimpulse;
            c1.vz -= cnz * cimpulse;
            c2.vx += cnx * cimpulse;
            c2.vz += cnz * cimpulse;
            emitSparks(c1.x + cnx * c1.radius, 1.0, c1.z + cnz * c1.radius, -cnx * 5, -cnz * 5, 0xffffff);
          }
        }
      }
    }
    
    updateBall(dt);
    checkPads(dt);
    if (ball.z < -FIELD_L / 2 - GOAL_DEPTH * 0.55 && Math.abs(ball.x) < GOAL_W / 2) scoreGoal("player");
    if (ball.z > FIELD_L / 2 + GOAL_DEPTH * 0.55 && Math.abs(ball.x) < GOAL_W / 2) scoreGoal("ai");
    run.toastTime = Math.max(0, run.toastTime - dt);
    if (run.toastTime <= 0 && toastEl) toastEl.classList.remove("show");
    
    for (const spark of sparks) {
      if (spark.life <= 0) continue;
      spark.life = Math.max(0, spark.life - dt);
      spark.mesh.position.x += spark.vx * dt;
      spark.mesh.position.y += spark.vy * dt;
      spark.mesh.position.z += spark.vz * dt;
      spark.vy -= 8 * dt;
      const mat = spark.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = spark.life / spark.maxLife;
      if (spark.life <= 0) spark.mesh.visible = false;
    }

    // Record current state for replay system
    replayBuffer.push({
      player: {
        x: player.x,
        y: player.y,
        z: player.z,
        yaw: player.yaw,
        boost: player.boost,
        onGround: player.onGround,
        vx: player.vx,
        vy: player.vy,
        vz: player.vz
      },
      ai: {
        x: ai.x,
        y: ai.y,
        z: ai.z,
        yaw: ai.yaw,
        boost: ai.boost,
        onGround: ai.onGround,
        vx: ai.vx,
        vy: ai.vy,
        vz: ai.vz
      },
      ball: {
        x: ball.x,
        y: ball.y,
        z: ball.z,
        vx: ball.vx,
        vz: ball.vz,
        spinX: ball.spinX,
        spinZ: ball.spinZ,
        lastSpeed: ball.lastSpeed
      },
      playerBoostVisual,
      aiBoostVisual,
      isHit: ballHitThisFrame
    });
    if (replayBuffer.length > REPLAY_MAX_FRAMES) {
      replayBuffer.shift();
    }
  }

  function syncObjects(timeS: number) {
    for (const car of [player, ai, ...extraCars]) {
      car.punch = Math.max(0, car.punch - 0.025);
      car.group.position.set(car.x, car.y, car.z);
      const forward = { x: Math.sin(car.yaw), z: Math.cos(car.yaw) };
      setActorFacing(car.group, forward);
      
      const fx = Math.sin(car.yaw);
      const fz = Math.cos(car.yaw);
      const rx = Math.cos(car.yaw);
      const rz = -Math.sin(car.yaw);
      const forwardSpeed = car.vx * fx + car.vz * fz;
      const sideSpeed = car.vx * rx + car.vz * rz;
      
      car.group.rotateX(clamp(forwardSpeed * 0.003, -0.05, 0.05));
      car.group.rotateZ(clamp(sideSpeed * 0.01, -0.08, 0.08));

      const speed = len2(car.vx, car.vz);
      const scale = 1 + car.punch * 0.2;
      car.group.scale.set(scale, 1 + car.punch * 0.08, scale);
      car.shadow.position.set(car.x, 0.018, car.z);
      car.shadow.scale.setScalar(1 + clamp(car.y - CAR_Y, 0, 2) * -0.16);
      const boosting = car.boostTrail === player.boostTrail ? playerBoostVisual : aiBoostVisual && speed > 8;
      for (let i = 0; i < car.boostTrail.length; i += 1) {
        const flame = car.boostTrail[i];
        const back = 1.15 + i * 0.28;
        flame.position.set(car.x - forward.x * back, car.y + 0.42 + Math.sin(timeS * 20 + i) * 0.04, car.z - forward.z * back);
        flame.rotation.y = car.yaw;
        flame.scale.setScalar(boosting ? (1 - i * 0.09) * (0.9 + Math.sin(timeS * 32 + i) * 0.16) : 0.001);
        const mat = flame.material as THREE.MeshBasicMaterial;
        mat.opacity = boosting ? 0.65 - i * 0.1 : 0;
      }
    }
    ball.mesh.position.set(ball.x, ball.y + Math.sin(timeS * 3) * 0.025, ball.z);
    ball.mesh.rotation.set(ball.spinX, 0, ball.spinZ);
    ball.ring.position.copy(ball.mesh.position);
    ball.ring.rotation.set(Math.PI / 2 + timeS * 0.35, timeS * 0.6, 0);
    ball.shadow.position.set(ball.x, 0.015, ball.z);
    const ballScale = 1 + clamp(ball.lastSpeed / 26, 0, 1) * 0.1;
    ball.mesh.scale.set(ballScale, 1 / ballScale, ballScale);
    for (const pad of pads) {
      const active = pad.cooldown <= 0;
      pad.mesh.position.y = active ? Math.sin(timeS * 4 + pad.x) * 0.035 : -0.04;
      pad.mesh.rotation.y += active ? 0.018 : 0.004;
      const mat = pad.core.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = active ? 0.65 + Math.sin(timeS * 6) * 0.12 : 0.05;
      pad.mesh.scale.setScalar(active ? 1 : 0.72);
    }
  }

  function updateCamera(dt: number) {
    if (phase === "replay") {
      // Epic tracking camera that orbits or follows the ball at a dramatic cinematic angle
      // Positioned slightly elevated, tracing the ball's trajectory
      const totalFrames = replayActiveFrames.length;
      const progress = totalFrames > 0 ? (replayPlaybackIndex / totalFrames) : 0;
      const heightOffset = 3.2 + Math.sin(progress * Math.PI * 1.5) * 1.4; // slow vertical panning
      const distanceOffset = 6.2 + Math.cos(progress * Math.PI * 1.2) * 1.1; // slow horizontal dolly
      
      reusableCamPos.set(
        ball.x - distanceOffset,
        heightOffset,
        ball.z + distanceOffset
      );
      
      // Prevent going out of stadium bounds
      reusableCamPos.x = clamp(reusableCamPos.x, -FIELD_W / 2 + 1.5, FIELD_W / 2 - 1.5);
      reusableCamPos.z = clamp(reusableCamPos.z, -FIELD_L / 2 - GOAL_DEPTH + 1.0, FIELD_L / 2 + GOAL_DEPTH - 1.0);
      
      // Interpolate position smoothly
      camera.position.lerp(reusableCamPos, 1 - Math.exp(-14 * dt));
      
      // Look directly at the ball
      reusableLook.set(ball.x, ball.y, ball.z);
      camera.lookAt(reusableLook);
      
      camera.fov += (62 - camera.fov) * 0.1;
      camera.updateProjectionMatrix();
      return;
    }

    if (isFirstKickoff && run.kickoff > 3.0 && phase === "playing") {
      const t = clamp((5.8 - run.kickoff) / 2.8, 0, 1);
      
      // Calculate target chase camera position (where the camera normally wants to end up)
      const chaseDistance = cameraMode === "Close" ? 5.0 : 12.0;
      const chaseHeight = cameraMode === "Close" ? 2.5 : 6.0;
      const speedVec = len2(player.vx, player.vz);
      const fwdX = Math.sin(player.yaw);
      const fwdZ = Math.cos(player.yaw);
      const finalCamX = clamp(player.x - fwdX * chaseDistance, -FIELD_W / 2 + 1.0, FIELD_W / 2 - 1.0);
      const finalCamY = chaseHeight + clamp(speedVec * 0.015, 0, 0.6);
      const finalCamZ = clamp(player.z - fwdZ * chaseDistance, -FIELD_L / 2 + 1.0, FIELD_L / 2 + 1.0);
      
      let camX = 0;
      let camY = 0;
      let camZ = 0;
      
      let lookX = 0;
      let lookY = 0;
      let lookZ = 0;

      if (t < 0.45) {
        // Stage 1: Side of stadium to above the ball
        const localT = t / 0.45;
        const easeT = localT * localT * (3 - 2 * localT); // Smoothstep ease
        
        // Start at side of field
        const startX = -26.0;
        const startY = 12.0;
        const startZ = 2.0;
        
        // Midpoint is elevated above the ball
        const midX = 0.0;
        const midY = 16.5;
        const midZ = -6.0;
        
        camX = startX + (midX - startX) * easeT;
        camY = startY + (midY - startY) * easeT;
        camZ = startZ + (midZ - startZ) * easeT;
        
        // Keep looking at the ball
        lookX = ball.x;
        lookY = ball.y + 0.3;
        lookZ = ball.z;
      } else {
        // Stage 2: Above the ball to behind the user's car with a beautiful circular orbit/spin
        const localT = (t - 0.45) / 0.55;
        const easeT = localT * localT * (3 - 2 * localT); // Smoothstep ease
        
        const midX = 0.0;
        const midY = 16.5;
        const midZ = -6.0;
        
        // We add an orbital spin to make it rotate beautifully behind the car
        const orbitAngle = (1.0 - easeT) * 1.5; 
        const rotX = Math.sin(orbitAngle) * 5.0 * (1.0 - easeT);
        const rotZ = Math.cos(orbitAngle) * 5.0 * (1.0 - easeT);
        
        camX = midX + (finalCamX - midX) * easeT + rotX;
        camY = midY + (finalCamY - midY) * easeT;
        camZ = midZ + (finalCamZ - midZ) * easeT + rotZ;
        
        // LookAt target transitions from ball to player
        lookX = ball.x + (player.x - ball.x) * easeT;
        lookY = (ball.y + 0.3) + (player.y + 0.8 - (ball.y + 0.3)) * easeT;
        lookZ = ball.z + (player.z - ball.z) * easeT;
      }
      
      camera.position.set(camX, camY, camZ);
      reusableLook.set(lookX, lookY, lookZ);
      camera.lookAt(reusableLook);
      
      camera.fov += (65 - camera.fov) * 0.1;
      camera.updateProjectionMatrix();
      return;
    }

    const speed = len2(player.vx, player.vz);
    const fwdX = Math.sin(player.yaw);
    const fwdZ = Math.cos(player.yaw);
    
    if (cameraMode === "Close" || cameraMode === "Far") {
      const distance = cameraMode === "Close" ? 7.0 : 16.0;
      const height = cameraMode === "Close" ? 3.5 : 8.0;
      
      reusableCamPos.set(
        player.x - fwdX * distance,
        height + clamp(speed * 0.015, 0, 0.6),
        player.z - fwdZ * distance
      );
      
      reusableCamPos.x = clamp(reusableCamPos.x, -FIELD_W / 2 + 1.0, FIELD_W / 2 - 1.0);
      reusableCamPos.z = clamp(reusableCamPos.z, -FIELD_L / 2 + 1.0, FIELD_L / 2 + 1.0);
      
      const damping = 1 - Math.exp(-22 * dt); // very tight tracking
      camera.position.lerp(reusableCamPos, damping);
      
      const targetLook = new THREE.Vector3(
        player.x + fwdX * 5.0,
        player.y + 0.8,
        player.z + fwdZ * 5.0
      );
      
      if (reusableLook.lengthSq() < 0.1) reusableLook.copy(targetLook);
      reusableLook.lerp(targetLook, 1 - Math.exp(-18 * dt));
      
      camera.lookAt(reusableLook);
      
      const baseFov = 65;
      camera.fov += (clamp(baseFov + speed * 0.4, baseFov, baseFov + 15) - camera.fov) * 0.2;
    } else {
      const height = 45;
      
      reusableCamPos.set(player.x, height, player.z + 0.1);
      const damping = 1 - Math.exp(-22 * dt); // tight overhead tracking
      camera.position.lerp(reusableCamPos, damping);
      
      reusableLook.set(player.x, 0, player.z);
      camera.lookAt(reusableLook);
      
      camera.fov += (50 - camera.fov) * 0.2;
    }
    
    camera.updateProjectionMatrix();
  }

  let lastHud = "";
  function updateHud() {
    const sec = Math.ceil(run.timeLeft);
    const clock = run.overtime ? "OT" : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    const status = phase === "loading" ? "LOADING" : phase === "replay" ? "REPLAY" : run.overtime ? "NEXT GOAL WINS" : run.kickoff > 3.0 ? "GET READY" : run.kickoff > 0 ? "COUNTDOWN" : sec <= 10 ? "FINAL SECONDS" : sec <= 30 ? "PRESSURE" : "CAR FOOTBALL ARENA";
    const hudKey = `${run.playerGoals}|${run.aiGoals}|${clock}|${status}|${Math.round(player.boost)}|${phase}|${Math.floor(gameTimeS * 6) % 2}`;
    if (hudKey !== lastHud) {
      lastHud = hudKey;
      if (boostTextEl) boostTextEl.textContent = `BOOST ${Math.round(player.boost)}%`;
      
      // Clear with dark tech theme background
      lcdCtx.fillStyle = "#070d19";
      lcdCtx.fillRect(0, 0, 1024, 512);
      
      // Neon green grid background style lines
      lcdCtx.strokeStyle = "rgba(67, 245, 255, 0.05)";
      lcdCtx.lineWidth = 1;
      for (let x = 0; x < 1024; x += 32) {
        lcdCtx.beginPath();
        lcdCtx.moveTo(x, 0);
        lcdCtx.lineTo(x, 512);
        lcdCtx.stroke();
      }
      for (let y = 0; y < 512; y += 32) {
        lcdCtx.beginPath();
        lcdCtx.moveTo(0, y);
        lcdCtx.lineTo(1024, y);
        lcdCtx.stroke();
      }
      
      // High-tech outer neon blue border
      lcdCtx.strokeStyle = "#1f86ff";
      lcdCtx.lineWidth = 14;
      lcdCtx.strokeRect(7, 7, 1010, 498);
      
      // Soft cyan inner border
      lcdCtx.strokeStyle = "rgba(67, 245, 255, 0.3)";
      lcdCtx.lineWidth = 2;
      lcdCtx.strokeRect(18, 18, 988, 476);
      
      // Center vertical divider
      lcdCtx.fillStyle = "rgba(67, 245, 255, 0.15)";
      lcdCtx.fillRect(510, 40, 4, 432);
      
      lcdCtx.textBaseline = "middle";
      
      // Arena Header
      lcdCtx.font = "bold 26px 'JetBrains Mono', monospace";
      lcdCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
      lcdCtx.textAlign = "center";
      lcdCtx.fillText("CAR FOOTBALL ARENA", 512, 55);
      
      // Team Labels
      lcdCtx.font = "bold 52px 'Inter', sans-serif";
      lcdCtx.fillStyle = "#1f86ff";
      lcdCtx.fillText("YOU", 260, 95);
      
      lcdCtx.fillStyle = "#ff3d3d";
      lcdCtx.fillText("AI", 764, 95);
      
      // Big Neon Scores
      lcdCtx.font = "bold 240px 'JetBrains Mono', monospace";
      
      // Player Score with Glow
      lcdCtx.shadowColor = "#1f86ff";
      lcdCtx.shadowBlur = 24;
      lcdCtx.fillStyle = "#1f86ff";
      lcdCtx.fillText(String(run.playerGoals), 260, 260);
      
      // AI Score with Glow
      lcdCtx.shadowColor = "#ff3d3d";
      lcdCtx.shadowBlur = 24;
      lcdCtx.fillStyle = "#ff3d3d";
      lcdCtx.fillText(String(run.aiGoals), 764, 260);
      
      // Disable shadow blur for text readability
      lcdCtx.shadowBlur = 0;
      
      // Central Clock Display
      if (phase === "replay") {
        lcdCtx.font = "bold 90px 'JetBrains Mono', monospace";
        lcdCtx.fillStyle = (Math.floor(gameTimeS * 6) % 2 === 0) ? "#ffd32a" : "#ff3d3d";
        lcdCtx.shadowColor = "#ff3d3d";
        lcdCtx.shadowBlur = 18;
        lcdCtx.fillText("REPLAY", 512, 215);
        lcdCtx.shadowBlur = 0;
      } else {
        lcdCtx.font = "bold 130px 'JetBrains Mono', monospace";
        if (sec <= 10 && !run.overtime) {
          lcdCtx.fillStyle = "#ff3d3d";
          lcdCtx.shadowColor = "#ff3d3d";
          lcdCtx.shadowBlur = 15;
        } else {
          lcdCtx.fillStyle = "#ffffff";
          lcdCtx.shadowColor = "rgba(255, 255, 255, 0.5)";
          lcdCtx.shadowBlur = 8;
        }
        lcdCtx.fillText(clock, 512, 215);
        lcdCtx.shadowBlur = 0;
      }
      
      // Lower Status Bar
      lcdCtx.fillStyle = "rgba(7, 20, 38, 0.85)";
      lcdCtx.fillRect(320, 360, 384, 70);
      lcdCtx.strokeStyle = "#43f5ff";
      lcdCtx.lineWidth = 3;
      lcdCtx.strokeRect(320, 360, 384, 70);
      
      lcdCtx.font = "bold 34px 'Inter', sans-serif";
      lcdCtx.fillStyle = "#43f5ff";
      lcdCtx.fillText(status, 512, 395);
      
      lcdTexture.needsUpdate = true;
    }
    if (boostBarEl) boostBarEl.style.transform = `scaleX(${clamp(player.boost / 100, 0, 1)})`;
  }

  function render(ms: number, dt: number) {
    // Dynamically update the side screens (white background, animated/scrolling texts, goal overlays)
    const timeS = ms / 1000;

    if (phase === "replay") {
      // Plays at slow motion speed (about 32 frames per second playback)
      replayPlaybackIndex += dt * 32;
      const totalRecordedFrames = replayActiveFrames.length;
      if (totalRecordedFrames > 0) {
        const currentFrameIndex = Math.min(totalRecordedFrames - 1, Math.floor(replayPlaybackIndex));
        const frame = replayActiveFrames[currentFrameIndex];
        if (frame) {
          player.x = frame.player.x;
          player.y = frame.player.y;
          player.z = frame.player.z;
          player.yaw = frame.player.yaw;
          player.boost = frame.player.boost;
          player.onGround = frame.player.onGround;
          player.vx = frame.player.vx;
          player.vy = frame.player.vy;
          player.vz = frame.player.vz;

          ai.x = frame.ai.x;
          ai.y = frame.ai.y;
          ai.z = frame.ai.z;
          ai.yaw = frame.ai.yaw;
          ai.boost = frame.ai.boost;
          ai.onGround = frame.ai.onGround;
          ai.vx = frame.ai.vx;
          ai.vy = frame.ai.vy;
          ai.vz = frame.ai.vz;

          ball.x = frame.ball.x;
          ball.y = frame.ball.y;
          ball.z = frame.ball.z;
          ball.vx = frame.ball.vx;
          ball.vz = frame.ball.vz;
          ball.spinX = frame.ball.spinX;
          ball.spinZ = frame.ball.spinZ;
          ball.lastSpeed = frame.ball.lastSpeed;

          playerBoostVisual = frame.playerBoostVisual;
          aiBoostVisual = frame.aiBoostVisual;
        }
      }

      if (replayPlaybackIndex >= totalRecordedFrames) {
        phase = "playing";
        if (replayOverlay) {
          replayOverlay.style.display = "none";
        }
        replayBuffer.length = 0; // clear buffer
        replayActiveFrames = [];
        resetKickoff(run.lastGoal);
      }
    }
    
    if (goalBannerTimer > 0) {
      goalBannerTimer = Math.max(0, goalBannerTimer - dt);
    }
    
    const showGoal = goalBannerTimer > 0 && goalBannerScorer;

    for (let i = 0; i < 4; i++) {
      const canvas = screenCanvases[i];
      const ctx = screenCtxs[i];
      const texture = techTextures[i];
      if (!canvas || !ctx || !texture) continue;

      if (showGoal) {
        // --- GOAL BANNER ANIMATION ---
        const scorer = goalBannerScorer;
        const flashRate = 12; // flashes per second
        const isFlashOn = Math.floor(timeS * flashRate) % 2 === 0;

        if (scorer === "player") {
          ctx.fillStyle = isFlashOn ? "#ffffff" : "#1f86ff";
        } else {
          ctx.fillStyle = isFlashOn ? "#ffffff" : "#ff3d3d";
        }
        ctx.fillRect(0, 0, 512, 128);

        // Bold neon accents
        ctx.strokeStyle = scorer === "player" ? "#0066cc" : "#cc0000";
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, 502, 118);

        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, 482, 98);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const pulse = 1.0 + Math.sin(timeS * 16) * 0.08;
        ctx.save();
        ctx.translate(256, 64);
        ctx.scale(pulse, pulse);

        ctx.font = "italic bold 44px 'Inter', sans-serif";
        ctx.fillStyle = isFlashOn ? "#111111" : "#ffffff";
        
        const scorerText = scorer === "player" ? "GOAL BY PLAYER!" : "GOAL BY AI BOT!";
        ctx.fillText(`⚽ ${scorerText} ⚽`, 0, 0);
        ctx.restore();
      } else {
        // --- STANDARD DYNAMIC STATE ---
        // Clean white background as requested: "side per majood sabhi screen ka color white ker do"
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 128);

        // Soft tech grid pattern to keep the stadium look premium
        ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= 512; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke();
        }
        for (let y = 0; y <= 128; y += 32) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        }

        // Carbon side plates
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, 16, 128);
        ctx.fillRect(512 - 16, 0, 16, 128);

        // Tech white status indicators on margins
        ctx.fillStyle = "#ffffff";
        for (let dotY = 16; dotY < 128; dotY += 32) {
          ctx.beginPath(); ctx.arc(8, dotY, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(512 - 8, dotY, 3, 0, Math.PI * 2); ctx.fill();
        }

        // Horizontal warning-stripes styled borders at top and bottom
        ctx.fillStyle = "rgba(30, 41, 59, 0.15)";
        ctx.fillRect(16, 0, 480, 8);
        ctx.fillRect(16, 120, 480, 8);

        // Dynamic cycling messages
        const msgIndex = Math.floor(timeS / 4) % cycleMessages.length;
        const screenText = cycleMessages[(msgIndex + i) % cycleMessages.length];

        // Manual text scroll logic
        const textWidth = 360;
        const scrollSpeed = 120; // pixels per second
        const scrollRange = 512 + textWidth;
        const rawScroll = (timeS * scrollSpeed) + (i * 180);
        const textX = 512 - (rawScroll % scrollRange);

        ctx.font = "bold 34px 'Inter', sans-serif";
        ctx.fillStyle = "#0f172a"; // Deep charcoal color text for crisp legibility
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        // Draw scrolling text
        ctx.fillText(screenText, textX, 64);
        // Draw wrapped instance for seamless scrolling
        ctx.fillText(screenText, textX + scrollRange, 64);
      }

      texture.needsUpdate = true;
    }

    if (isCyber && starfield) {
      starfield.rotation.y += 0.02 * dt;
      starfield.rotation.x += 0.01 * dt;
    }

    // Dynamic Audience Animations (Jumping, Celebrating, Waving, and Squashing/Stretching)
    const isCelebrating = goalBannerTimer > 0;
    for (let i = 0; i < audienceMembers.length; i++) {
      const p = audienceMembers[i];
      const speedMult = isCelebrating ? 4.5 : 1.0;
      const ampMult = isCelebrating ? 4.0 : 1.0;
      const bounce = Math.abs(Math.sin(timeS * p.speed * speedMult + p.phaseOffset));
      
      p.mesh.position.y = p.baseY + bounce * p.amplitude * ampMult;
      
      // Dynamic organic squash-and-stretch
      p.mesh.scale.y = 1.0 + (bounce - 0.4) * (isCelebrating ? 0.5 : 0.18);
      const widthFactor = 1.0 - (bounce - 0.4) * (isCelebrating ? 0.18 : 0.06);
      p.mesh.scale.x = widthFactor;
      p.mesh.scale.z = widthFactor;
    }

    syncObjects(timeS);
    updateCamera(dt);
    if (loadingEl) loadingEl.classList.toggle("hidden", phase !== "loading");
    updateHud();
    renderer.render(scene, camera);
  }

  function loop(ms: number) {
    if (disposed) return;
    if (!lastMs) lastMs = ms;
    const dt = Math.min(0.05, (ms - lastMs) / 1000);
    lastMs = ms;
    gameTimeS = ms / 1000;
    update(dt);
    render(ms, dt);
    raf = requestAnimationFrame(loop);
  }

  buildArena();
  createBoostPads();
  resetKickoff(null);
  phase = "playing";
  onResize();
  
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      const c = mount.querySelector('.boostball-canvas');
      if (c) c.remove();
    }
  };
}

