const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  '      teamColors: matchTeams?.blueColors ? matchTeams.blueColors.map((color, idx) => ({\n        color: color,\n        accent: matchTeams.blueAccents?.[idx] || 0xffffff\n      })) : undefined\n    });',
  '      teamColors: matchTeams?.blueColors ? matchTeams.blueColors.map((color, idx) => ({\n        color: color,\n        accent: matchTeams.blueAccents?.[idx] || 0xffffff\n      })) : undefined,\n      modelUrl: selectedCar?.modelUrl\n    });'
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Updated App.tsx createGame");
