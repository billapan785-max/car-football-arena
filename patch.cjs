const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

// Replace everything from `// 5. Procedural 3D Sci-Fi` down to `// 6. High-Tech Rotating Pedestal`
const startStr = '// 5. Procedural 3D Sci-Fi Garage Tunnel Background';
const endStr = '// 6. High-Tech Rotating Pedestal';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `// 5. Single Road Tunnel with Neon Lights
    const tunnelGroup = new THREE.Group();
    scene.add(tunnelGroup);

    // Main Flat Road (Dark glossy asphalt)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.3,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 100), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.2, -40);
    tunnelGroup.add(floor);

    // Glowing Neon Lines on Road
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 2.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 });

    // Left and Right continuous yellow lines
    const leftLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 100), yellowMat);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-2.0, -0.19, -40);
    tunnelGroup.add(leftLine);

    const rightLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 100), yellowMat);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(2.0, -0.19, -40);
    tunnelGroup.add(rightLine);

    // Center dashed white line and floor lights
    for(let i = 0; i < 20; i++) {
      const zPos = -i * 5;
      
      const dashedLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 2.5), whiteMat);
      dashedLine.rotation.x = -Math.PI / 2;
      dashedLine.position.set(0, -0.19, zPos);
      tunnelGroup.add(dashedLine);

      // White center point lights for realistic glow
      const centerLight = new THREE.PointLight(0xffffff, 0.8, 8);
      centerLight.position.set(0, 0.5, zPos);
      tunnelGroup.add(centerLight);

      // Side yellow point lights
      const leftLight = new THREE.PointLight(0xffaa00, 1.0, 8);
      leftLight.position.set(-2.0, 0.5, zPos);
      tunnelGroup.add(leftLight);

      const rightLight = new THREE.PointLight(0xffaa00, 1.0, 8);
      rightLight.position.set(2.0, 0.5, zPos);
      tunnelGroup.add(rightLight);
    }

    // Simple Tunnel Walls and Ceiling (Dark, sleek)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0f18, roughness: 0.1, metalness: 0.9 });
    
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(100, 10), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-4, 4.8, -40);
    tunnelGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(100, 10), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(4, 4.8, -40);
    tunnelGroup.add(rightWall);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8, 100), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 9.8, -40);
    tunnelGroup.add(ceiling);

    // Neon Arches in the tunnel
    const cyanNeonMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 2.0 });
    for (let i = 1; i <= 6; i++) {
      const zPos = -i * 12;
      
      const archL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 0.2), cyanNeonMat);
      archL.position.set(-3.9, 4.8, zPos);
      tunnelGroup.add(archL);
      
      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 0.2), cyanNeonMat);
      archR.position.set(3.9, 4.8, zPos);
      tunnelGroup.add(archR);
      
      const archTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 0.2), cyanNeonMat);
      archTop.position.set(0, 9.7, zPos);
      tunnelGroup.add(archTop);

      const archLight = new THREE.PointLight(0x00d2ff, 2.0, 15);
      archLight.position.set(0, 8, zPos);
      tunnelGroup.add(archLight);
    }

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    backWall.position.set(0, 4.8, -80);
    tunnelGroup.add(backWall);

    `;
  
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Successfully patched.");
} else {
  console.log("Could not find start or end strings.");
}
