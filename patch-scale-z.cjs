const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

code = code.replace(
  "const [carY, setCarY] = useState(-0.4);\n  const [carScale, setCarScale] = useState(1.0);",
  "const [carY, setCarY] = useState(-0.4);\n  const [carZ, setCarZ] = useState(-1.5);\n  const [carScale, setCarScale] = useState(0.7);"
);

code = code.replace(
  "pedestalRef.current.position.y = carY;",
  "pedestalRef.current.position.y = carY;\n      pedestalRef.current.position.z = carZ;"
);

code = code.replace(
  `        <label>
          Car Scale: {carScale.toFixed(2)}
          <br/>
          <input type="range" min="0.1" max="3" step="0.01" value={carScale} onChange={(e) => setCarScale(parseFloat(e.target.value))} />
        </label>`,
  `        <label>
          Car Depth (Z): {carZ.toFixed(2)}
          <br/>
          <input type="range" min="-10" max="5" step="0.01" value={carZ} onChange={(e) => setCarZ(parseFloat(e.target.value))} />
        </label>
        <label>
          Car Scale: {carScale.toFixed(2)}
          <br/>
          <input type="range" min="0.1" max="3" step="0.01" value={carScale} onChange={(e) => setCarScale(parseFloat(e.target.value))} />
        </label>`
);

code = code.replace(
  "pedestalGroup.position.y = -0.4;",
  "pedestalGroup.position.y = carY;\n    pedestalGroup.position.z = carZ;"
);

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Patched scale and Z-axis");
