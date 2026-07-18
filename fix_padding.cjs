const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "padding: '20px', maxHeight: renderedActiveModal === 'settings' ? '100vh' : '60vh', height: renderedActiveModal === 'settings' ? '100%' : 'auto', display: 'flex', flexDirection: 'column', overflowY: 'auto'",
  "padding: renderedActiveModal === 'settings' ? '0' : '20px', maxHeight: renderedActiveModal === 'settings' ? '100vh' : '60vh', height: renderedActiveModal === 'settings' ? '100%' : 'auto', display: renderedActiveModal === 'settings' ? 'flex' : 'block', flexDirection: 'column', overflowY: 'auto'"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
