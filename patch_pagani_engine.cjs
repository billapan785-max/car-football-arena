const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

const targetStr = `carModel.scale.setScalar(scaleFactor);`;
const replaceStr = `
    if (modelUrl && typeof modelUrl === 'string' && modelUrl.includes('pagani')) {
      carModel.rotation.x = -Math.PI / 2;
    }
    carModel.scale.setScalar(scaleFactor);
`;

engine = engine.replace(targetStr, replaceStr);

const materialTarget = `if (child.name.toLowerCase().includes('glass') || child.name.toLowerCase().includes('window')) {`;
const materialReplace = `
              const matName = child.material.name ? child.material.name.toLowerCase() : '';
              if (child.name.toLowerCase().includes('glass') || child.name.toLowerCase().includes('window') || matName.includes('window') || matName.includes('glass')) {
`;

engine = engine.replace(materialTarget, materialReplace);

const bodyTarget = `} else if (child.name.toLowerCase().includes('body')) {`;
const bodyReplace = `} else if (child.name.toLowerCase().includes('body') || matName === 'material' || matName.includes('body')) {`;

engine = engine.replace(bodyTarget, bodyReplace);

fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
console.log("Patched engine.ts for Pagani.");
