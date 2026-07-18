const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add modelUrl to interface
app = app.replace(
  '  price: number;\n}',
  '  price: number;\n  modelUrl?: string;\n}'
);

// Add Pagani to presets
const paganiStr = `
  {
    id: 'pagani',
    name: 'PAGANI ZONDA',
    color: 0xcccccc,
    colorHexStr: '#cccccc',
    accent: 0xff3333,
    accentHexStr: '#ff3333',
    speed: 99,
    boost: 95,
    handling: 92,
    description: 'Ultra-exclusive hypercar imported directly to your garage.',
    price: 800,
    modelUrl: '/paganizondacinque.glb'
  },`;

app = app.replace(
  'const CAR_PRESETS: CarPreset[] = [',
  'const CAR_PRESETS: CarPreset[] = [' + paganiStr
);

// Add modelUrl to createGame call
app = app.replace(
  '      teamColors: matchTeams?.blueColors ? matchTeams.blueColors.map((color, idx) => ({\n        color: color,\n        accent: matchTeams.blueAccents[idx]\n      })) : []\n    });',
  '      teamColors: matchTeams?.blueColors ? matchTeams.blueColors.map((color, idx) => ({\n        color: color,\n        accent: matchTeams.blueAccents[idx]\n      })) : [],\n      modelUrl: selectedCar?.modelUrl\n    });'
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Updated App.tsx with Pagani");
