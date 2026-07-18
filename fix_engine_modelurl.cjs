const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

engine = engine.replace(
  "if (modelUrl.includes('car.glb')) {",
  "if (modelUrl && typeof modelUrl === 'string' && modelUrl.includes('car.glb')) {"
);

fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
console.log("Patched engine.ts to check if modelUrl is a valid string.");
