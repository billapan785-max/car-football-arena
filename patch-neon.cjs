const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const neonSetup = `
    // --- Animated Neon Base ---
    const neonBaseGroup = new THREE.Group();
    pedestalGroup.add(neonBaseGroup);

    // Glowing center plane
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256; glowCanvas.height = 256;
    const gCtx = glowCanvas.getContext('2d');
    if (gCtx) {
      const grad = gCtx.createRadialGradient(128,128,0, 128,128,128);
      grad.addColorStop(0, 'rgba(0, 210, 255, 0.8)');
      grad.addColorStop(0.5, 'rgba(0, 210, 255, 0.3)');
      grad.addColorStop(1, 'rgba(0, 210, 255, 0)');
      gCtx.fillStyle = grad;
      gCtx.fillRect(0,0,256,256);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({ 
      map: glowTex, 
      transparent: true, 
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), glowMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.01;
    neonBaseGroup.add(glowPlane);

    // Rotating Neon Rings
    const neonRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const rGeo = new THREE.RingGeometry(1.6 + i * 0.4, 1.65 + i * 0.4, 64);
      const rMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00d2ff : 0xdc58ee, // Cyan and Pink
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.y = 0.02 + (i * 0.01);
      neonBaseGroup.add(rMesh);
      neonRings.push(rMesh);
    }
    // --------------------------
`;

code = code.replace(
  "pedestalGroup.position.z = carZ;",
  "pedestalGroup.position.z = carZ;\n" + neonSetup
);

const animSetup = `
      // Rotate the pedestal and car
      pedestalGroup.rotation.y += delta * 0.4;
      
      // Animate Neon Base
      const t = time / 1000;
      const pulse = (Math.sin(t * 3.0) + 1) / 2;
      glowPlane.scale.setScalar(0.9 + pulse * 0.2);
      glowPlane.material.opacity = 0.4 + pulse * 0.6;
      
      neonRings.forEach((r, i) => {
        r.rotation.z -= delta * (i + 1) * 0.8;
        (r.material as THREE.MeshBasicMaterial).opacity = 0.4 + (Math.sin(t * 4.0 + i) + 1) * 0.3;
      });
`;

code = code.replace(
  "// Rotate the pedestal and car\n      pedestalGroup.rotation.y += delta * 0.4;",
  animSetup
);

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Added neon base animations.");
