const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

const targetStr = `    carModel.scale.setScalar(0.52); 
    
    // Temporarily hide shadow/ground/floor/light/plane meshes to get an accurate bounding box of the wheels/body
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        const name = (child.name || "").toLowerCase();
        if (name.includes("shadow") || name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("light")) {
          child.visible = false;
        }
      }
    });

    // Compute the bounding box of the scaled model
    const box = new THREE.Box3().setFromObject(carModel);
    const minY = box.min.y;

    // Restore visibility
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        const name = (child.name || "").toLowerCase();
        if (name.includes("shadow") || name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("light")) {
          child.visible = true;
        }
      }
    });
    
    // Align tires perfectly with the ground plane (World Y = 0)
    carModel.position.y = -minY - CAR_Y;
    carModel.rotation.y = 0; `;

const replaceStr = `    carModel.scale.setScalar(1.0); 
    
    // Temporarily hide shadow/ground/floor/light/plane meshes to get an accurate bounding box of the wheels/body
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        const name = (child.name || "").toLowerCase();
        if (name.includes("shadow") || name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("light")) {
          child.visible = false;
        }
      }
    });

    // Compute the bounding box of the native model
    let box = new THREE.Box3().setFromObject(carModel);
    const size = box.getSize(new THREE.Vector3());
    
    // Determine the max horizontal dimension and normalize it so it matches car.glb's bounding size (which is roughly ~3.2 in length at scale 0.52)
    const maxHorizontal = Math.max(size.x, size.z);
    
    // For car.glb, maxHorizontal natively was ~6.15 (6.15 * 0.52 = 3.2). 
    // We want the new max dimension to be 3.2.
    // If it's incredibly tiny or huge, we clamp the scale factor a bit just in case.
    let scaleFactor = 3.2 / maxHorizontal;
    if (!isFinite(scaleFactor) || scaleFactor === 0) scaleFactor = 0.52;
    
    carModel.scale.setScalar(scaleFactor);

    // Recompute box after scaling
    box = new THREE.Box3().setFromObject(carModel);
    const minY = box.min.y;
    const center = box.getCenter(new THREE.Vector3());

    // Restore visibility
    carModel.traverse((child: any) => {
      if (child.isMesh) {
        const name = (child.name || "").toLowerCase();
        if (name.includes("shadow") || name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("light")) {
          child.visible = true;
        }
      }
    });
    
    // Align tires perfectly with the ground plane (World Y = 0)
    // And center the mesh so it sits perfectly inside the physics hitbox!
    carModel.position.x = -center.x;
    carModel.position.z = -center.z;
    carModel.position.y = -minY - CAR_Y;

    // Special fix for models that might be rotated sideways natively
    // car.glb faces -Z, some models might face +Z, +X, -X.
    // We assume mostly standard (-Z or +Z). We will just keep rotation.y = 0.
    carModel.rotation.y = 0;`;

if (engine.includes(targetStr)) {
  engine = engine.replace(targetStr, replaceStr);
  fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
  console.log("Updated bounding box and scale logic!");
} else {
  console.log("Could not find the target string!");
}
