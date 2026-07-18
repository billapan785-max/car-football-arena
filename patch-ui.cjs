const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

code = code.replace("import { useEffect, useRef } from 'react';", "import { useEffect, useRef, useState } from 'react';");

code = code.replace(
  "export default function GarageCanvas({ color, accent }: GarageCanvasProps) {",
  "export default function GarageCanvas({ color, accent }: GarageCanvasProps) {\n  const [carY, setCarY] = useState(-0.4);\n  const [carScale, setCarScale] = useState(1.0);\n  const pedestalRef = useRef<THREE.Group | null>(null);"
);

code = code.replace(
  "const pedestalGroup = new THREE.Group();\n    scene.add(pedestalGroup);\n        // (Pedestal meshes removed to use the background image's pedestal)\n    // Move the group down a bit to match the image pedestal height\n    pedestalGroup.position.y = -0.4;",
  "const pedestalGroup = new THREE.Group();\n    scene.add(pedestalGroup);\n    pedestalRef.current = pedestalGroup;\n    pedestalGroup.position.y = carY;"
);

// We need to apply carScale to the carGroup
code = code.replace(
  "carGroup.scale.setScalar(1.2);",
  "carGroup.scale.setScalar(1.2 * carScale);"
);

// But state changes will trigger useEffect. We need to handle that carefully, or just not include state in dependency array.
// Actually, since we want to avoid re-mounting, let's just use refs and direct DOM updates if possible, 
// or let it re-mount if it's easy. It's fast enough.

