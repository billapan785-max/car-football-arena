const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  "} from 'lucide-react';",
  "  Bell,\n  Video,\n  LogOut,\n  Gamepad2\n} from 'lucide-react';"
);
fs.writeFileSync('src/App.tsx', app, 'utf8');
