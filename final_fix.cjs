const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const strToReplace = `                      </div>
                    </div>
                    </div>
                    {/* BOTTOM ACTION BUTTONS */}`;

if (app.includes(strToReplace)) {
  app = app.replace(strToReplace, `                      </div>
                    </div>
                    {/* BOTTOM ACTION BUTTONS */}`);
} else {
  // If it's different, let's just find exactly where BOTTOM ACTION BUTTONS is
  const regex = /                      <\/div>\s*{\/\* BOTTOM ACTION BUTTONS \*\//;
  if (regex.test(app)) {
    app = app.replace(regex, `                      </div>\n                    </div>\n                    {/* BOTTOM ACTION BUTTONS */}`);
  }
}

fs.writeFileSync('src/App.tsx', app, 'utf8');
