const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (app.includes('createGame(mountRef.current, {')) {
  console.log("createGame is present in App.tsx");
}
