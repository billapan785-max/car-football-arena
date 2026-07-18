const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

code = code.replace("scene.add(transformControl);", "scene.add(transformControl as unknown as THREE.Object3D);");
code = code.replace("transformControl.addEventListener('dragging-changed', (event) => {", "transformControl.addEventListener('dragging-changed', (event: any) => {");
code = code.replace("const onKeyDown = (event) => {", "const onKeyDown = (event: KeyboardEvent) => {");

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Fixed TS errors.");
