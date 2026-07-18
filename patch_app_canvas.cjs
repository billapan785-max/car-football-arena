const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  '<GarageCanvas \n              color={gameCarColor} \n              accent={gameCarAccent} \n              carY={carY}\n              carZ={carZ}\n              carScale={carScale}\n              backgroundImage="/mainmenubg.png?v=2"\n            />',
  '<GarageCanvas \n              color={gameCarColor} \n              accent={gameCarAccent} \n              carY={carY}\n              carZ={carZ}\n              carScale={carScale}\n              backgroundImage="/mainmenubg.png?v=2"\n              modelUrl={selectedCar?.modelUrl}\n            />'
);

app = app.replace(
  '<GarageCanvas \n               color={customPrimaryColor ? parseInt(customPrimaryColor.replace(\'#\', \'0x\')) : selectedCar.color}\n               accent={customAccentColor ? parseInt(customAccentColor.replace(\'#\', \'0x\')) : selectedCar.accent}\n               backgroundImage="/Garage.png?v=2"\n               carScale={1.6}\n               carY={-0.4}\n            />',
  '<GarageCanvas \n               color={customPrimaryColor ? parseInt(customPrimaryColor.replace(\'#\', \'0x\')) : selectedCar.color}\n               accent={customAccentColor ? parseInt(customAccentColor.replace(\'#\', \'0x\')) : selectedCar.accent}\n               backgroundImage="/Garage.png?v=2"\n               carScale={1.6}\n               carY={-0.4}\n               modelUrl={selectedCar?.modelUrl}\n            />'
);

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log("Updated App.tsx canvas usages");
