const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const startStr = '// 5. Room Geometry';
const endStr = '// 6. High-Tech Rotating Pedestal';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  // We'll remove everything between startStr and endStr.
  code = code.substring(0, startIndex) + '\n    ' + code.substring(endIndex);
  
  // Now modify renderer to be transparent and remove bloom
  code = code.replace(
    "const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });",
    "const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });\n    renderer.setClearColor(0x000000, 0);"
  );

  // We should also switch composer.render() back to renderer.render() to prevent bloom issues with alpha
  code = code.replace("composer.render();", "renderer.render(scene, camera);");
  code = code.replace("composer.setSize(w, h);", "");

  // Update container style to include background image
  code = code.replace(
    "display: 'flex',",
    "display: 'flex',\n        backgroundImage: 'url(/garadgebg.png)',\n        backgroundSize: 'cover',\n        backgroundPosition: 'center',"
  );

  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Successfully patched BG.");
} else {
  console.log("Could not find start or end strings.");
}
