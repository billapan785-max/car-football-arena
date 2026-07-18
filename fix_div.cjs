const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "                      </div>\n                    {/* BOTTOM ACTION BUTTONS */}",
  "                      </div>\n                    </div>\n                    {/* BOTTOM ACTION BUTTONS */}"
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
