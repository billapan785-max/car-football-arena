const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
const replacement = fs.readFileSync('replacement.txt', 'utf8');

const startMarker = "{/* CONTENT AREA */}";
const endMarker = "{/* BOTTOM ACTION BUTTONS */}";

const startIndex = app.indexOf(startMarker);
const endIndex = app.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const before = app.substring(0, startIndex);
  const after = app.substring(endIndex);
  app = before + replacement + "\n                    " + after;
  fs.writeFileSync('src/App.tsx', app, 'utf8');
  console.log('Successfully patched!');
} else {
  console.error('Markers not found!');
}
