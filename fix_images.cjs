const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Bust cache for splash.jpeg
app = app.replace(/\/splash\.jpeg/g, '/splash.jpeg?v=2');

// 2. Bust cache for other images
app = app.replace(/\/loginpage\.png/g, '/loginpage.png?v=2');
app = app.replace(/\/mainmenubg\.png/g, '/mainmenubg.png?v=2');
app = app.replace(/\/modebutton\.png/g, '/modebutton.png?v=2');
app = app.replace(/\/playbutton\.png/g, '/playbutton.png?v=2');
app = app.replace(/\/garagebutton\.png/g, '/garagebutton.png?v=2');
app = app.replace(/\/Garage\.png/g, '/Garage.png?v=2');

// 3. Fix background shorthands
app = app.replace(
  "background: 'url(/modebutton.png?v=2) no-repeat center/100% 100%',",
  "backgroundImage: 'url(\"/modebutton.png?v=2\")',\n                backgroundRepeat: 'no-repeat',\n                backgroundPosition: 'center',\n                backgroundSize: '100% 100%',"
);

app = app.replace(
  "background: 'url(/playbutton.png?v=2) no-repeat center/100% 100%',",
  "backgroundImage: 'url(\"/playbutton.png?v=2\")',\n                backgroundRepeat: 'no-repeat',\n                backgroundPosition: 'center',\n                backgroundSize: '100% 100%',"
);

app = app.replace(
  "background: 'url(/garagebutton.png?v=2) no-repeat center/cover',",
  "backgroundImage: 'url(\"/garagebutton.png?v=2\")',\n                backgroundRepeat: 'no-repeat',\n                backgroundPosition: 'center',\n                backgroundSize: 'cover',"
);

// 4. Remove the flaky error logic from splash screen preloader
// We will replace the entire useEffect for splash loading with a simpler one
const startPreload = app.indexOf('// Advanced Preloading & Asset Check');
const endPreload = app.indexOf('// Initialize Background Audio');
if (startPreload !== -1 && endPreload !== -1) {
  const newPreload = `// Advanced Preloading & Asset Check
    const imgBg = new Image();
    imgBg.src = '/splash.jpeg?v=2';
    imgBg.onload = () => {
      setBgImage('/splash.jpeg?v=2');
      setHasBgError(false);
    };
    imgBg.onerror = () => {
      // Ignore error and just keep trying to load it in the DOM
      setHasBgError(false);
    };

    const imgLogo = new Image();
    imgLogo.src = '/logo.png';
    imgLogo.onload = () => {
      setLogoImage('/logo.png');
      setHasLogoError(false);
    };
    imgLogo.onerror = () => {
      setHasLogoError(true);
    };

    `;
  app = app.substring(0, startPreload) + newPreload + app.substring(endPreload);
}

fs.writeFileSync('src/App.tsx', app, 'utf8');

// Now ScreenGate
let gate = fs.readFileSync('src/components/ScreenGate.tsx', 'utf8');
gate = gate.replace(/\/leftgate\.png/g, '/leftgate.png?v=2');
gate = gate.replace(/\/rightgate\.png/g, '/rightgate.png?v=2');
fs.writeFileSync('src/components/ScreenGate.tsx', gate, 'utf8');

console.log("Images fixed.");
