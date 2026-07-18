const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const target = fs.readFileSync('target.txt', 'utf8');
const replacement = fs.readFileSync('replacement.txt', 'utf8');

const newApp = app.replace(target, replacement);
if (newApp === app) {
  console.log("No replacement made. Target string not found.");
} else {
  fs.writeFileSync('src/App.tsx', newApp, 'utf8');
  console.log("Replacement successful.");
}
