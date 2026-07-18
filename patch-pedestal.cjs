const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const startStr = '// Outer dark ring base';
const endStr = '// 7. Car Loading / Mounting';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  // We'll remove everything between startStr and endStr.
  code = code.substring(0, startIndex) + '\n    // (Pedestal meshes removed to use the background image\'s pedestal)\n    // Move the group down a bit to match the image pedestal height\n    pedestalGroup.position.y = -0.8;\n    ' + code.substring(endIndex);

  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Successfully patched Pedestal.");
} else {
  console.log("Could not find start or end strings.");
}
