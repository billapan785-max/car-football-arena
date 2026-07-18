const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `<GarageCanvas 
              color={gameCarColor} 
              accent={gameCarAccent} 
              carY={carY}
              carZ={carZ}
              carScale={carScale}
              backgroundImage="/mainmenubg.png?v=2"
            />`;

const replaceStr = `<GarageCanvas 
              color={gameCarColor} 
              accent={gameCarAccent} 
              carY={carY}
              carZ={carZ}
              carScale={carScale}
              backgroundImage="/mainmenubg.png?v=2"
              modelUrl={selectedCar?.modelUrl}
            />`;
            
if (app.includes(targetStr)) {
    app = app.replace(targetStr, replaceStr);
    console.log("Replaced first canvas.");
} else {
    console.log("Could not find first canvas. Let's do a regex search.");
    app = app.replace(/<GarageCanvas[^>]*carScale={carScale}[^>]*backgroundImage="\/mainmenubg\.png\?v=2"\n\s*\/>/g, 
    `<GarageCanvas 
              color={gameCarColor} 
              accent={gameCarAccent} 
              carY={carY}
              carZ={carZ}
              carScale={carScale}
              backgroundImage="/mainmenubg.png?v=2"
              modelUrl={selectedCar?.modelUrl}
            />`);
}
fs.writeFileSync('src/App.tsx', app, 'utf8');
