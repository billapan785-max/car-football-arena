const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : { friendOnline: true, gameUpdate: true, activity: true, nextMatch: true };
  });`;

const newState = `const [generalNotifications, setGeneralNotifications] = useState<boolean>(() => {
    return localStorage.getItem('generalNotifications') !== 'false';
  });`;

app = app.replace(oldState, newState);
fs.writeFileSync('src/App.tsx', app, 'utf8');
