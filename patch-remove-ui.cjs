const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const startStr = "<div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 8, color: 'white', display: 'flex', flexDirection: 'column', gap: 10 }}>";
const endStr = "      </div>\n    </div>\n  );\n}";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + "    </div>\n  );\n}";
  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Removed sliders panel.");
} else {
  console.log("Could not find boundaries.");
}
