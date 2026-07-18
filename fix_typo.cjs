const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace("{/* BOTTOM ACTION BUTTONS */}}", "{/* BOTTOM ACTION BUTTONS */}");

fs.writeFileSync('src/App.tsx', app, 'utf8');
