const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

// Add imports
code = code.replace(
  "import * as THREE from 'three';",
  "import * as THREE from 'three';\nimport { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';\nimport { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';"
);

// Add controls
const startStr = '// 8. Animation loop';
const controlsCode = `
    // Add Controls for Editing
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.update();

    const transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
    });
    scene.add(transformControl);

    // Attach to the car group instead of pedestal so user can move it
    if (currentCarRef.current) {
       // Stop rotation for editing
       // transformControl.attach(currentCarRef.current);
       transformControl.attach(pedestalGroup);
    }
    
    // Add keydown listener to switch modes
    const onKeyDown = (event) => {
      switch (event.key) {
        case 't': transformControl.setMode('translate'); break;
        case 'r': transformControl.setMode('rotate'); break;
        case 's': transformControl.setMode('scale'); break;
        case 'p': console.log("Pedestal Position:", pedestalGroup.position); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // 8. Animation loop`;

code = code.replace(startStr, controlsCode);

// Stop rotation
code = code.replace("pedestalGroup.rotation.y += delta * 0.4;", "// pedestalGroup.rotation.y += delta * 0.4; // Stopped for editing");

// Cleanup
code = code.replace(
  "renderer.dispose();",
  "renderer.dispose();\n      window.removeEventListener('keydown', onKeyDown);\n      orbit.dispose();\n      transformControl.dispose();"
);

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Added TransformControls.");
