const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The modal container
app = app.replace(
  `width: '100%',
              maxWidth: '850px',
              margin: '0 20px',`,
  `width: '100%',
              maxWidth: renderedActiveModal === 'settings' ? '100vw' : '850px',
              height: renderedActiveModal === 'settings' ? '100vh' : 'auto',
              margin: renderedActiveModal === 'settings' ? '0' : '0 20px',
              borderRadius: renderedActiveModal === 'settings' ? '0' : '16px',`
);

app = app.replace(
  `maxHeight: renderedActiveModal === 'settings' ? '78vh' : '60vh'`,
  `maxHeight: renderedActiveModal === 'settings' ? '100vh' : '60vh', height: renderedActiveModal === 'settings' ? '100%' : 'auto', display: renderedActiveModal === 'settings' ? 'flex' : 'block', flexDirection: 'column'`
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
