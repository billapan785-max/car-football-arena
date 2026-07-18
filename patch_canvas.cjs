const fs = require('fs');
let garage = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

// Update interface
garage = garage.replace(
  '  backgroundImage?: string;\n}',
  '  backgroundImage?: string;\n  modelUrl?: string;\n}'
);

// Update function signature
garage = garage.replace(
  '  carScale = 0.85,\n  backgroundImage = \'/mainmenubg.png?v=2\'\n}: GarageCanvasProps) {',
  '  carScale = 0.85,\n  backgroundImage = \'/mainmenubg.png?v=2\',\n  modelUrl\n}: GarageCanvasProps) {'
);

// Update createCarModel call
garage = garage.replace(
  'const carData = createCarModel(color, accent);',
  'const carData = createCarModel(color, accent, 1.0, modelUrl);'
);

fs.writeFileSync('src/components/GarageCanvas.tsx', garage, 'utf8');
console.log("Updated GarageCanvas.tsx");

let squad = fs.readFileSync('src/components/SquadCanvas.tsx', 'utf8');
squad = squad.replace(
  'const carData = createCarModel(member.color, member.accent, carScale);',
  'const carData = createCarModel(member.color, member.accent, carScale, (member as any).modelUrl);'
);
fs.writeFileSync('src/components/SquadCanvas.tsx', squad, 'utf8');
console.log("Updated SquadCanvas.tsx");

