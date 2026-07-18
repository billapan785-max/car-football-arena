const fs = require('fs');

let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

// Replace loadCarGltf and the cache variables
const loadCarGltfStart = engine.indexOf('const loader = new GLTFLoader();');
const loadCarGltfEnd = engine.indexOf('export function createCarModel');
if (loadCarGltfStart !== -1 && loadCarGltfEnd !== -1) {
  const newLoadCode = `const loader = new GLTFLoader();
const cachedGltfs: Record<string, any> = {};
const loadingGltfs: Record<string, ((gltf: any) => void)[]> = {};

function loadCarGltf(modelUrl: string, onLoad: (gltf: any) => void) {
  if (cachedGltfs[modelUrl]) {
    onLoad(cachedGltfs[modelUrl]);
    return;
  }
  if (!loadingGltfs[modelUrl]) {
    loadingGltfs[modelUrl] = [];
  }
  loadingGltfs[modelUrl].push(onLoad);
  if (loadingGltfs[modelUrl].length > 1) return;

  loader.load(
    modelUrl,
    (gltf) => {
      cachedGltfs[modelUrl] = gltf;
      const callbacks = loadingGltfs[modelUrl] || [];
      delete loadingGltfs[modelUrl];
      callbacks.forEach((cb) => cb(gltf));
    },
    undefined,
    (error) => {
      console.error("Error loading " + modelUrl + ":", error);
      delete loadingGltfs[modelUrl];
    }
  );
}

`;
  engine = engine.substring(0, loadCarGltfStart) + newLoadCode + engine.substring(loadCarGltfEnd);
}

// Update createCarModel signature
engine = engine.replace(
  'export function createCarModel(color: number, accent: number, scale: number = 1.0): { group: THREE.Group; wheels: THREE.Object3D[] } {',
  'export function createCarModel(color: number, accent: number, scale: number = 1.0, modelUrl: string = "/car.glb"): { group: THREE.Group; wheels: THREE.Object3D[] } {'
);

// Update loadCarGltf call inside createCarModel
engine = engine.replace(
  'loadCarGltf((gltf) => {',
  'loadCarGltf(modelUrl, (gltf) => {'
);

fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
console.log("Updated engine.ts");
