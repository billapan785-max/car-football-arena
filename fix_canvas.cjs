const fs = require('fs');
let garage = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

garage = garage.replace(
  "  carScale = 0.85,\n  backgroundImage = '/mainmenubg.png'\n}: GarageCanvasProps) {",
  "  carScale = 0.85,\n  backgroundImage = '/mainmenubg.png',\n  modelUrl\n}: GarageCanvasProps) {"
);

fs.writeFileSync('src/components/GarageCanvas.tsx', garage, 'utf8');
