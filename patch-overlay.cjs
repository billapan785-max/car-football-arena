const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const oldReturn = `<div 
        ref={containerRef} 
        style={{ 
           position: 'absolute', top: 0, left: 0,
          width: '100%', 
           height: '100%', 
           zIndex: 5,
          pointerEvents: 'none' // Let clicks pass through if needed, but we probably want it to rotate? We can disable pointerEvents on canvas or container
        }} 
       />`;

const newReturn = `<div 
        ref={containerRef} 
        style={{ 
           position: 'absolute', top: 0, left: 0,
          width: '100%', 
           height: '100%', 
           zIndex: 5,
          pointerEvents: 'none'
        }} 
       />
      {/* 
        This is a hidden DOM element placed exactly over the 3D car. 
        Because 3D canvas objects cannot be selected by the AI Studio DOM picker, 
        this div acts as a proxy so you can select the "car" with the edit tool.
      */}
      <div 
        id="car-3d-model"
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '350px',
          height: '180px',
          zIndex: 6, 
          cursor: 'pointer',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="3D Car Model"
      >
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
          Select Car
        </div>
      </div>`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Added car overlay.");
