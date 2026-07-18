const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The modal wrapper currently has:
// width: '100%',
// maxWidth: renderedActiveModal === 'settings' ? '100vw' : '850px',
// height: renderedActiveModal === 'settings' ? '100vh' : 'auto',
// margin: renderedActiveModal === 'settings' ? '0' : '0 20px',
// borderRadius: renderedActiveModal === 'settings' ? '0' : '16px',

app = app.replace(
  "height: renderedActiveModal === 'settings' ? '100vh' : 'auto',",
  "height: renderedActiveModal === 'settings' ? '100vh' : 'auto',\n              minHeight: renderedActiveModal === 'settings' ? '100vh' : 'auto',"
);

app = app.replace(
  "display: renderedActiveModal === 'settings' ? 'flex' : 'block'",
  "display: 'flex'"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
