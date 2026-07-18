const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const startStr = '// Add Controls for Editing';
const endStr = '// 8. Animation loop';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);

  code = code.replace(
    "import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';\nimport { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';\n",
    ""
  );

  code = code.replace(
    "// pedestalGroup.rotation.y += delta * 0.4; // Stopped for editing",
    "pedestalGroup.rotation.y += delta * 0.4;"
  );

  code = code.replace(
    "window.removeEventListener('keydown', onKeyDown);\n      orbit.dispose();\n      transformControl.dispose();",
    ""
  );

  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Removed controls.");
} else {
  console.log("Could not find boundaries.");
}
