const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  "{renderedActiveModal === 'settings' ? '⚙️ SYSTEM & CONTROL SETTINGS' :",
  "{renderedActiveModal === 'settings' ? 'GAME SETTINGS' :"
);
fs.writeFileSync('src/App.tsx', app, 'utf8');
