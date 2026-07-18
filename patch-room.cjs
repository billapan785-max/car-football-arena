const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

const startStr = '// 4. Beautiful Sci-Fi Garage Studio Lights';
const endStr = '// 7. Car Loading / Mounting';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `// 4. Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const topSpotLight = new THREE.SpotLight(0xffffff, 4.0, 25, Math.PI / 4, 0.5, 1);
    topSpotLight.position.set(0, 8, 0);
    topSpotLight.castShadow = true;
    scene.add(topSpotLight);

    // Left Blue Light
    const blueFill = new THREE.PointLight(0x00aaff, 2.0, 20);
    blueFill.position.set(-8, 4, 2);
    scene.add(blueFill);

    // Right Orange Light
    const orangeFill = new THREE.PointLight(0xff8800, 2.0, 20);
    orangeFill.position.set(8, 4, 2);
    scene.add(orangeFill);

    // 5. Room Geometry (Wide Sci-Fi Hangar)
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // Materials
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x111620,
      roughness: 0.4,
      metalness: 0.8
    });
    
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      roughness: 0.5,
      metalness: 0.7
    });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), darkMetalMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.2, -10);
    roomGroup.add(floor);

    // Floor Grid lines
    const gridHelper = new THREE.GridHelper(40, 20, 0x000000, 0x000000);
    gridHelper.position.set(0, -0.19, -10);
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    roomGroup.add(gridHelper);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), darkMetalMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 10, -10);
    roomGroup.add(ceiling);

    // Ceiling glowing ring (matching pedestal)
    const ceilRingGeo = new THREE.TorusGeometry(3.5, 0.1, 16, 100);
    const blueNeonMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 2.0 });
    const ceilRing = new THREE.Mesh(ceilRingGeo, blueNeonMat);
    ceilRing.rotation.x = Math.PI / 2;
    ceilRing.position.set(0, 9.9, 0);
    roomGroup.add(ceilRing);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 15), darkMetalMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-12, 5, -10);
    roomGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 15), darkMetalMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(12, 5, -10);
    roomGroup.add(rightWall);

    // Back Wall with Hangar Door Opening
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x0c111a, roughness: 0.6, metalness: 0.5 });
    
    // Bottom part of back wall
    const backWallBottom = new THREE.Mesh(new THREE.PlaneGeometry(40, 2), backWallMat);
    backWallBottom.position.set(0, 0.8, -18);
    roomGroup.add(backWallBottom);

    // Top part of back wall (above door)
    const backWallTop = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), backWallMat);
    backWallTop.position.set(0, 8, -18);
    roomGroup.add(backWallTop);

    // Side parts of back wall
    const backWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), backWallMat);
    backWallLeft.position.set(-14, 4.8, -18);
    roomGroup.add(backWallLeft);

    const backWallRight = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), backWallMat);
    backWallRight.position.set(14, 4.8, -18);
    roomGroup.add(backWallRight);

    // Cyberpunk Cityscape Background (outside the door)
    const cityGeo = new THREE.PlaneGeometry(24, 6);
    // Simple gradient/city texture representation using a canvas
    const cityCanvas = document.createElement('canvas');
    cityCanvas.width = 512;
    cityCanvas.height = 128;
    const cityCtx = cityCanvas.getContext('2d');
    if(cityCtx) {
      const grad = cityCtx.createLinearGradient(0, 128, 0, 0);
      grad.addColorStop(0, '#001133');
      grad.addColorStop(1, '#000000');
      cityCtx.fillStyle = grad;
      cityCtx.fillRect(0, 0, 512, 128);
      // Draw some glowing buildings
      for(let i=0; i<40; i++) {
        const h = Math.random() * 80 + 20;
        const w = Math.random() * 15 + 5;
        const x = Math.random() * 512;
        cityCtx.fillStyle = Math.random() > 0.5 ? '#00aaff' : '#ff00aa';
        cityCtx.globalAlpha = 0.6;
        cityCtx.fillRect(x, 128 - h, w, h);
      }
    }
    const cityTex = new THREE.CanvasTexture(cityCanvas);
    const cityMat = new THREE.MeshBasicMaterial({ map: cityTex, fog: false });
    const cityscape = new THREE.Mesh(cityGeo, cityMat);
    cityscape.position.set(0, 4.8, -25);
    roomGroup.add(cityscape);

    // Hangar Door Glowing Edge
    const doorEdgeGeo = new THREE.BoxGeometry(24, 0.2, 0.5);
    const orangeNeonMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 2.0 });
    const doorTopEdge = new THREE.Mesh(doorEdgeGeo, orangeNeonMat);
    doorTopEdge.position.set(0, 6.0, -17.8);
    roomGroup.add(doorTopEdge);

    const doorBottomEdge = new THREE.Mesh(doorEdgeGeo, orangeNeonMat);
    doorBottomEdge.position.set(0, 1.8, -17.8);
    roomGroup.add(doorBottomEdge);


    // Left Wall Screen (SPEED - Blue)
    const leftScreenGeo = new THREE.PlaneGeometry(6, 4);
    const leftScreenCanvas = document.createElement('canvas');
    leftScreenCanvas.width = 512;
    leftScreenCanvas.height = 256;
    const lsCtx = leftScreenCanvas.getContext('2d');
    if(lsCtx) {
      lsCtx.fillStyle = '#001a33';
      lsCtx.fillRect(0,0,512,256);
      lsCtx.strokeStyle = '#00aaff';
      lsCtx.lineWidth = 4;
      lsCtx.strokeRect(10, 10, 492, 236);
      lsCtx.fillStyle = '#00aaff';
      lsCtx.font = 'bold 30px Arial';
      lsCtx.fillText('SPEED', 30, 50);
      
      // Wireframe car drawing
      lsCtx.beginPath();
      lsCtx.moveTo(100, 150);
      lsCtx.lineTo(150, 100);
      lsCtx.lineTo(350, 100);
      lsCtx.lineTo(400, 150);
      lsCtx.lineTo(400, 200);
      lsCtx.lineTo(100, 200);
      lsCtx.closePath();
      lsCtx.stroke();
    }
    const leftScreenTex = new THREE.CanvasTexture(leftScreenCanvas);
    const leftScreenMat = new THREE.MeshBasicMaterial({ map: leftScreenTex });
    const leftScreen = new THREE.Mesh(leftScreenGeo, leftScreenMat);
    leftScreen.rotation.y = Math.PI / 2;
    leftScreen.position.set(-11.9, 4, -4);
    roomGroup.add(leftScreen);

    // Right Wall Screen (POWER - Orange)
    const rightScreenGeo = new THREE.PlaneGeometry(6, 4);
    const rightScreenCanvas = document.createElement('canvas');
    rightScreenCanvas.width = 512;
    rightScreenCanvas.height = 256;
    const rsCtx = rightScreenCanvas.getContext('2d');
    if(rsCtx) {
      rsCtx.fillStyle = '#331a00';
      rsCtx.fillRect(0,0,512,256);
      rsCtx.strokeStyle = '#ff8800';
      rsCtx.lineWidth = 4;
      rsCtx.strokeRect(10, 10, 492, 236);
      rsCtx.fillStyle = '#ff8800';
      rsCtx.font = 'bold 30px Arial';
      rsCtx.fillText('POWER', 30, 50);

      // Engine wireframe drawing
      rsCtx.beginPath();
      rsCtx.moveTo(150, 120);
      rsCtx.lineTo(350, 120);
      rsCtx.lineTo(350, 180);
      rsCtx.lineTo(150, 180);
      rsCtx.closePath();
      rsCtx.stroke();
      rsCtx.beginPath();
      rsCtx.arc(250, 150, 40, 0, Math.PI*2);
      rsCtx.stroke();
    }
    const rightScreenTex = new THREE.CanvasTexture(rightScreenCanvas);
    const rightScreenMat = new THREE.MeshBasicMaterial({ map: rightScreenTex });
    const rightScreen = new THREE.Mesh(rightScreenGeo, rightScreenMat);
    rightScreen.rotation.y = -Math.PI / 2;
    rightScreen.position.set(11.9, 4, -4);
    roomGroup.add(rightScreen);

    // 6. High-Tech Rotating Pedestal (Platform) exactly like image
    const pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);

    // Outer dark ring base
    const pBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.2, 64), darkMetalMat);
    pBase.position.y = -0.1;
    pedestalGroup.add(pBase);

    // Blue Neon Ring 1
    const pNeonBlue = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.05, 16, 100), blueNeonMat);
    pNeonBlue.rotation.x = Math.PI / 2;
    pNeonBlue.position.y = 0.01;
    pedestalGroup.add(pNeonBlue);

    // Middle elevated ring
    const pMid = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.15, 64), panelMat);
    pMid.position.y = 0.05;
    pedestalGroup.add(pMid);

    // Orange Neon Accents on the ring
    for(let i=0; i<4; i++) {
       const ang = i * Math.PI / 2;
       const pNeonOrg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.2), orangeNeonMat);
       pNeonOrg.position.set(Math.cos(ang)*3.5, 0.13, Math.sin(ang)*3.5);
       pNeonOrg.rotation.y = -ang + Math.PI/2;
       pedestalGroup.add(pNeonOrg);
    }

    // Inner metallic plate
    const pInner = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.1, 64), darkMetalMat);
    pInner.position.y = 0.12;
    pedestalGroup.add(pInner);

    // Inner Blue Neon Ring
    const pNeonBlueInner = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 16, 100), blueNeonMat);
    pNeonBlueInner.rotation.x = Math.PI / 2;
    pNeonBlueInner.position.y = 0.18;
    pedestalGroup.add(pNeonBlueInner);
    
    // Very center plate
    const pCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.05, 64), panelMat);
    pCenter.position.y = 0.17;
    pedestalGroup.add(pCenter);

    `;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/GarageCanvas.tsx', code);
  console.log("Successfully patched.");
} else {
  console.log("Could not find start or end strings.");
}
