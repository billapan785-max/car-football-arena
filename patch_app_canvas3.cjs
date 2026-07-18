const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  '<GarageCanvas \n              color={gameCarColor} \n              accent={gameCarAccent} \n              carY={carY}\n              carZ={carZ}\n              carScale={carScale}\n            />',
  '<GarageCanvas \n              color={gameCarColor} \n              accent={gameCarAccent} \n              carY={carY}\n              carZ={carZ}\n              carScale={carScale}\n              modelUrl={selectedCar?.modelUrl}\n            />'
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Updated App.tsx canvas usages 3");
