const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

code = code.replace(
  "}, [carY, carScale]);",
  "}, [carY, carZ, carScale]);"
);

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Fixed dependencies.");
