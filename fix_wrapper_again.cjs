const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "maxWidth: renderedActiveModal === 'car_shop' ? '650px' : '480px',",
  "maxWidth: renderedActiveModal === 'settings' ? '100vw' : (renderedActiveModal === 'car_shop' ? '650px' : '480px'),"
);

app = app.replace(
  "height: 'auto',",
  "height: renderedActiveModal === 'settings' ? '100vh' : 'auto',"
);

app = app.replace(
  "borderRadius: '16px',",
  "borderRadius: renderedActiveModal === 'settings' ? '0' : '16px',"
);

app = app.replace(
  "padding: '16px', backdropFilter: 'blur(6px)' }}>",
  "padding: renderedActiveModal === 'settings' ? '0' : '16px', backdropFilter: 'blur(6px)' }}>"
);

app = app.replace(
  "<div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto', fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.45' }}>",
  "<div style={{ padding: renderedActiveModal === 'settings' ? '0' : '20px', maxHeight: renderedActiveModal === 'settings' ? 'calc(100vh - 54px)' : '60vh', height: renderedActiveModal === 'settings' ? 'calc(100vh - 54px)' : 'auto', overflowY: 'auto', fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.45', display: renderedActiveModal === 'settings' ? 'flex' : 'block', flexDirection: 'column' }}>"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
