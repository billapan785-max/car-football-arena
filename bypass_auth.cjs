const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "return user ? 'lobby' : 'login';",
  "return 'lobby';"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Patched App.tsx to bypass auth.");
