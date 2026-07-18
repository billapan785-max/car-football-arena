const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

engine = engine.replace(
  'const carModel = gltf.scene.clone();',
  'const carModel = gltf.scene.clone();\n    console.log("GLTF loaded:", modelUrl, "Scene children:", carModel.children.length);'
);

engine = engine.replace(
  'const box = new THREE.Box3().setFromObject(carModel);\n    const size = box.getSize(new THREE.Vector3());',
  'const box = new THREE.Box3().setFromObject(carModel);\n    const size = box.getSize(new THREE.Vector3());\n    console.log("Bounding box size for", modelUrl, ":", size);'
);

engine = engine.replace(
  'carModel.scale.setScalar(scaleFactor);',
  'carModel.scale.setScalar(scaleFactor);\n    console.log("Set scale factor to:", scaleFactor);'
);

fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
console.log("Patched engine.ts for logging");
