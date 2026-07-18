const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

code = code.replace("pedestalGroup.position.y = -0.8;", "pedestalGroup.position.y = -0.4;");

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Moved car up.");
