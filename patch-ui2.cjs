const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

// Replace the return statement to wrap it in a parent div with controls
const oldReturn = `return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        zIndex: 5,
        display: 'flex',
        backgroundImage: 'url(/garadgebg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        alignItems: 'center',
        justifyContent: 'center'
      }} 
    />
  );`;

const newReturn = `
  useEffect(() => {
    if (pedestalRef.current) {
      pedestalRef.current.position.y = carY;
    }
    if (currentCarRef.current) {
      currentCarRef.current.scale.setScalar(1.2 * carScale);
    }
  }, [carY, carScale]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div 
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1,
          backgroundImage: 'url(/garadgebg.png)', backgroundSize: 'cover', backgroundPosition: 'center'
        }}
      />
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute', top: 0, left: 0,
          width: '100%', 
          height: '100%', 
          zIndex: 5,
          pointerEvents: 'none' // Let clicks pass through if needed, but we probably want it to rotate? We can disable pointerEvents on canvas or container
        }} 
      />
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 8, color: 'white', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label>
          Car Height (Y): {carY.toFixed(2)}
          <br/>
          <input type="range" min="-2" max="2" step="0.01" value={carY} onChange={(e) => setCarY(parseFloat(e.target.value))} />
        </label>
        <label>
          Car Scale: {carScale.toFixed(2)}
          <br/>
          <input type="range" min="0.1" max="3" step="0.01" value={carScale} onChange={(e) => setCarScale(parseFloat(e.target.value))} />
        </label>
        <div style={{fontSize: '12px', color: '#aaa'}}>Adjust to fit the background image</div>
      </div>
    </div>
  );`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Applied UI patch.");
