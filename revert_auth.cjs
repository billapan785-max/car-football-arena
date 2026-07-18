const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "return 'lobby';",
  "return user ? 'lobby' : 'login';"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Reverted App.tsx bypass auth.");
