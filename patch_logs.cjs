const fs = require('fs');

let garage = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');
garage = garage.replace(
  'const carData = createCarModel(color, accent, 1.0, modelUrl);',
  'console.log("GarageCanvas mounting car with modelUrl:", modelUrl);\n      const carData = createCarModel(color, accent, 1.0, modelUrl);'
);
fs.writeFileSync('src/components/GarageCanvas.tsx', garage, 'utf8');

let engine = fs.readFileSync('src/game/engine.ts', 'utf8');
engine = engine.replace(
  'function loadCarGltf(modelUrl: string, onLoad: (gltf: any) => void) {',
  'function loadCarGltf(modelUrl: string, onLoad: (gltf: any) => void) {\n  console.log("loadCarGltf called with:", modelUrl);'
);
fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
