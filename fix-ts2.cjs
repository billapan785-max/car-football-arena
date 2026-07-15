const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

if (!code.includes("const [carY, setCarY]")) {
  code = code.replace(
    "import { useEffect, useRef } from 'react';",
    "import { useEffect, useRef, useState } from 'react';"
  );
  code = code.replace(
    "export default function GarageCanvas({ color, accent }: GarageCanvasProps) {",
    "export default function GarageCanvas({ color, accent }: GarageCanvasProps) {\n  const [carY, setCarY] = useState(-0.4);\n  const [carScale, setCarScale] = useState(1.0);\n  const pedestalRef = useRef<THREE.Group | null>(null);"
  );
  code = code.replace(
    "const pedestalGroup = new THREE.Group();\n    scene.add(pedestalGroup);",
    "const pedestalGroup = new THREE.Group();\n    scene.add(pedestalGroup);\n    pedestalRef.current = pedestalGroup;"
  );
  
  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Fixed state.");
} else {
  console.log("State already present");
}
