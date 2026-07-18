const fs = require('fs');
let squad = fs.readFileSync('src/components/SquadCanvas.tsx', 'utf8');
squad = squad.replace(
  'backgroundImage = \'/mainmenubg.png\'',
  'backgroundImage = \'/mainmenubg.png?v=2\''
);
fs.writeFileSync('src/components/SquadCanvas.tsx', squad, 'utf8');
