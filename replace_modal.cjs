const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
const replacement = fs.readFileSync('replacement.txt', 'utf8');

const startStr = "{/* SETTINGS PANEL */}";
const endStr = "{/* REPLAY HISTORY */}";

const startIndex = app.indexOf(startStr);
const endIndex = app.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  app = app.substring(0, startIndex) + replacement + "\n                " + app.substring(endIndex);
  fs.writeFileSync('src/App.tsx', app, 'utf8');
  console.log("Successfully replaced settings modal");
} else {
  console.log("Could not find start or end index");
}
