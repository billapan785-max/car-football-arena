const fs = require('fs');
let code = fs.readFileSync('src/components/GarageCanvas.tsx', 'utf8');

// replace composer stuff
code = code.replace("    // Setup Bloom Composer", "");
code = code.replace("    const renderScene = new RenderPass(scene, camera);", "");
code = code.replace("    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);", "");
code = code.replace("    bloomPass.threshold = 0.2;", "");
code = code.replace("    bloomPass.strength = 1.2; // Neon glow intensity", "");
code = code.replace("    bloomPass.radius = 0.5;", "");
code = code.replace("    const composer = new EffectComposer(renderer);", "");
code = code.replace("    composer.addPass(renderScene);", "");
code = code.replace("    composer.addPass(bloomPass);", "");

fs.writeFileSync('src/components/GarageCanvas.tsx', code);
console.log("Cleaned up composer.");
