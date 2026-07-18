const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

const oldShaderCode = `          // Use onBeforeCompile shader injection to paint only the body (mask = color_1 attribute)
          // This keeps the tires, windows, and mirrors in their original texture colors while 
          // coloring the body in beautiful solid pink, blue, green, etc.!
          const paintColorUniform = { value: new THREE.Color(color) };
          child.material.userData = child.material.userData || {};
          child.material.userData.paintColorUniform = paintColorUniform;
          
          child.material.onBeforeCompile = (shader: any) => {
            shader.uniforms.uPaintColor = paintColorUniform;
            
            // 1. Vertex Shader: Bind color_1 attribute and pass as varying
            shader.vertexShader = shader.vertexShader.replace(
              'void main() {',
              \`
              attribute vec4 color_1;
              varying vec4 vColor1;
              void main() {
                vColor1 = color_1;
              \`
            );
            
            // 2. Fragment Shader: Declare varying and uniform
            shader.fragmentShader = shader.fragmentShader.replace(
              'void main() {',
              \`
              varying vec4 vColor1;
              uniform vec3 uPaintColor;
              void main() {
              \`
            );
            
            // Replace the map fragment to apply paint color only where vColor1.r > 0.5 (body mask)
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              \`
              #include <map_fragment>
              if (vColor1.r > 0.5) {
                float maxVal = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
                float minVal = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
                float sat = maxVal - minVal;
                
                // Do not paint very dark details (like tires, wheel hubs, vents)
                bool isDark = maxVal < 0.24;
                
                // Do not paint bright, desaturated reflective surfaces (like chrome mirrors, glass, headlight reflectors)
                bool isBrightMirrorOrGlass = minVal > 0.62 && sat < 0.15;
                
                if (!isDark && !isBrightMirrorOrGlass) {
                  diffuseColor.rgb = uPaintColor;
                }
              }
              \`
            );
          };`;

const newShaderCode = `          if (modelUrl.includes('car.glb')) {
            const paintColorUniform = { value: new THREE.Color(color) };
            child.material.userData = child.material.userData || {};
            child.material.userData.paintColorUniform = paintColorUniform;
            
            child.material.onBeforeCompile = (shader: any) => {
              shader.uniforms.uPaintColor = paintColorUniform;
              shader.vertexShader = shader.vertexShader.replace(
                'void main() {',
                \`
                attribute vec4 color_1;
                varying vec4 vColor1;
                void main() {
                  vColor1 = color_1;
                \`
              );
              shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                \`
                varying vec4 vColor1;
                uniform vec3 uPaintColor;
                void main() {
                \`
              );
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                \`
                #include <map_fragment>
                if (vColor1.r > 0.5) {
                  float maxVal = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
                  float minVal = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
                  float sat = maxVal - minVal;
                  bool isDark = maxVal < 0.24;
                  bool isBrightMirrorOrGlass = minVal > 0.62 && sat < 0.15;
                  if (!isDark && !isBrightMirrorOrGlass) {
                    diffuseColor.rgb = uPaintColor;
                  }
                }
                \`
              );
            };
          } else {
            // For other models, try simple coloring if it's the body (often the largest mesh or specific names)
            if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('paint') || child.material.name.toLowerCase().includes('paint') || child.material.name.toLowerCase().includes('body') || child.material.name.toLowerCase().includes('car')) {
                child.material.color.set(color);
            }
          }`;

if (engine.includes(oldShaderCode)) {
  engine = engine.replace(oldShaderCode, newShaderCode);
  console.log("Patched shader in engine.ts");
} else {
  console.log("Could not find old shader code");
}
fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
