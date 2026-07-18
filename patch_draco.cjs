const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

const targetStr = `import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';`;
const replaceStr = `import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';`;

const targetStr2 = `const loader = new GLTFLoader();`;
const replaceStr2 = `const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);`;

if (engine.includes(targetStr)) {
  engine = engine.replace(targetStr, replaceStr);
}
if (engine.includes(targetStr2)) {
  engine = engine.replace(targetStr2, replaceStr2);
}
fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
console.log("Patched Draco Loader in engine.ts");
