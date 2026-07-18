const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "background: '#0a1329', \n              border: '2px solid rgba(67, 245, 255, 0.4)', \n              borderRadius: '16px',",
  "background: renderedActiveModal === 'settings' ? 'linear-gradient(180deg, #020611, #0a1329)' : '#0a1329', \n              border: renderedActiveModal === 'settings' ? 'none' : '2px solid rgba(67, 245, 255, 0.4)', \n              borderRadius: renderedActiveModal === 'settings' ? '0' : '16px',"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
