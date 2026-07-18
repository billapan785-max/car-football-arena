const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  "  Car\n  Bell,",
  "  Car,\n  Bell,"
);
fs.writeFileSync('src/App.tsx', app, 'utf8');
