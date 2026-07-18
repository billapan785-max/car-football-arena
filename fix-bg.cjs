const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

code = code.replace("scene.background = new THREE.Color(0x0a101d);", "scene.background = null; // null for transparent background");

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Fixed scene background.");
