const fs = require('fs');
let code = fs.readFileSync('src/game/engine.ts', 'utf8');

const regex = /\/\/ Car-to-Car collision[\s\S]*?emitSparks\(.*?\);\n      \}\n    \}/;

const replacement = `// Car-to-Car collision
    const allPlayableCars = [player, ai, ...extraCars];
    for (let i = 0; i < allPlayableCars.length; i++) {
      for (let j = i + 1; j < allPlayableCars.length; j++) {
        const c1 = allPlayableCars[i];
        const c2 = allPlayableCars[j];
        const cdx = c2.x - c1.x;
        const cdz = c2.z - c1.z;
        const cdist = Math.max(0.001, Math.sqrt(cdx*cdx + cdz*cdz));
        const cMinDist = c1.radius + c2.radius;
        if (cdist < cMinDist) {
          const cnx = cdx / cdist;
          const cnz = cdz / cdist;
          const coverlap = cMinDist - cdist;
          c1.x -= cnx * coverlap * 0.5;
          c1.z -= cnz * coverlap * 0.5;
          c2.x += cnx * coverlap * 0.5;
          c2.z += cnz * coverlap * 0.5;
          keepCarInArena(c1);
          keepCarInArena(c2);
          const crelVx = c2.vx - c1.vx;
          const crelVz = c2.vz - c1.vz;
          const ctoward = crelVx * cnx + crelVz * cnz;
          if (ctoward < 0) {
            const cimpulse = -ctoward * 0.6;
            c1.vx -= cnx * cimpulse;
            c1.vz -= cnz * cimpulse;
            c2.vx += cnx * cimpulse;
            c2.vz += cnz * cimpulse;
            emitSparks(c1.x + cnx * c1.radius, 1.0, c1.z + cnz * c1.radius, -cnx * 5, -cnz * 5, 0xffffff);
          }
        }
      }
    }`;

code = code.replace(regex, replacement);

// And we need to make sure syncObjects syncs the extra cars!
const syncRegex = /syncCar\(ai\);/;
if (code.includes('syncCar(ai);\n    for (const c of extraCars) syncCar(c);')) {
   // already updated
} else {
   code = code.replace(/syncCar\(ai\);/, 'syncCar(ai);\n    for (const c of extraCars) syncCar(c);');
}

fs.writeFileSync('src/game/engine.ts', code);
