const fs = require('fs');
let code = fs.readFileSync('src/game/engine.ts', 'utf8');

// Add isOnline to createGame options
code = code.replace(
  /export function createGame\(mount: HTMLElement, carOptions\?: \{ color: number; accent: number \}\) \{/,
  'export function createGame(mount: HTMLElement, carOptions?: { color: number; accent: number, isOnline?: boolean }) {'
);

// We will add an array of extraCars
code = code.replace(
  /const ai: Car = \{([\s\S]*?)punch: 0\n  \};/,
  `const ai: Car = {$1punch: 0\n  };\n  const extraCars: Car[] = [];\n  if (carOptions?.isOnline) {\n    for (let i = 0; i < 2; i++) {\n      const cAlly = createCarModel(playerColor, playerAccent);\n      const cAllyObj: Car = { ...player, id: "ally"+i, group: cAlly.group, wheels: cAlly.wheels, shadow: contactShadow(0.85), boostTrail: [] };\n      cAllyObj.x = i === 0 ? -12 : 12;\n      cAllyObj.z = FIELD_L / 2 - 7;\n      extraCars.push(cAllyObj);\n      cAllyObj.group.castShadow = true;\n      scene.add(cAllyObj.shadow, cAllyObj.group);\n      \n      const cOpp = createCarModel(0xff332e, 0xffd12d);\n      const cOppObj: Car = { ...ai, id: "opp"+i, group: cOpp.group, wheels: cOpp.wheels, shadow: contactShadow(0.82), boostTrail: [] };\n      cOppObj.x = i === 0 ? -12 : 12;\n      cOppObj.z = -FIELD_L / 2 + 7;\n      extraCars.push(cOppObj);\n      cOppObj.group.castShadow = true;\n      scene.add(cOppObj.shadow, cOppObj.group);\n    }\n  }`
);

// We need to initialize boost trails for extra cars
code = code.replace(
  /ai\.boostTrail = createTrail\(0xffb02e\);/,
  `ai.boostTrail = createTrail(0xffb02e);\n  for (const c of extraCars) {\n    c.boostTrail = createTrail(c.id.startsWith("ally") ? playerColor : 0xffb02e);\n  }`
);

// Reset extra cars on kickoff
code = code.replace(
  /ai\.boost = Math\.max\(ai\.boost, 55\);/,
  `ai.boost = Math.max(ai.boost, 55);\n    for (let i=0; i<extraCars.length; i++) {\n      const c = extraCars[i];\n      const isAlly = c.id.startsWith("ally");\n      const idx = isAlly ? Math.floor(i/2) : Math.floor((i-1)/2);\n      c.x = idx === 0 ? -12 : 12;\n      c.y = CAR_Y;\n      c.z = isAlly ? FIELD_L / 2 - 7 : -FIELD_L / 2 + 7;\n      c.vx = 0; c.vy = 0; c.vz = 0;\n      c.yaw = isAlly ? Math.PI : 0;\n      c.boost = Math.max(c.boost, 55);\n    }`
);

// Update extra cars in loop
code = code.replace(
  /updateAi\(ai, dt, false\);/g, // Wait, it's just updateAi(dt) currently
  `updateAi(dt);\n    for (const c of extraCars) {\n      updateAi(c, dt, c.id.startsWith("ally"));\n    }`
);

code = code.replace(
  /updateAi\(dt\);/,
  `updateAi(ai, dt, false);\n    for (const c of extraCars) {\n      updateAi(c, dt, c.id.startsWith("ally"));\n    }`
);

// Collide ball
code = code.replace(
  /collideCarBall\(ai, false\);/,
  `collideCarBall(ai, false);\n    for (const c of extraCars) {\n      collideCarBall(c, c.id.startsWith("ally"));\n    }`
);

// We need to update syncObjects and replay frames! This might be tricky because replay frame records only player and ai.
// Let's just not record extra cars in replay to save time, or we can just ignore replay rendering for extra cars for now.

// Wait, the user said "stadium me bhi dono sides per us hisab se cars ajae gi" (cars will appear on both sides). 
// Let's fix updateAi signature in the code first. We did sed before but let's do it cleanly here.
code = code.replace(
  /function updateAi\(car: Car, dt: number, isAlly: boolean\) \{([\s\S]*?)function wallThump/,
  `function updateAi(car: Car, dt: number, isAlly: boolean) {
    if (run.kickoff > 0) {
      updateCar(car, dt, 0, 0, false, false, 0.8);
      return;
    }
    if (run.aiDelay > 0 && !isAlly) { // only main AI gets delay maybe?
      run.aiDelay -= dt;
      updateCar(car, dt, 0, 0, false, false, 0.8);
      return;
    }
    const minuteRamp = clamp((300 - run.timeLeft) / 260, 0, 1);
    const aiMul = 0.82 + minuteRamp * 0.25 + run.playerGoals * 0.035;
    const targetGoalZ = isAlly ? -FIELD_L / 2 : FIELD_L / 2;
    const behind = isAlly ? (ball.z < car.z ? 2.4 : -2.2) : (ball.z > car.z ? -2.4 : 2.2);
    const targetX = clamp(ball.x * 0.86, -FIELD_W / 2 + 2, FIELD_W / 2 - 2);
    const targetZ = clamp(ball.z + behind, -FIELD_L / 2 + 3, FIELD_L / 2 - 3);
    const dx = targetX - car.x;
    const dz = targetZ - car.z;
    const desiredYaw = Math.atan2(dx, dz);
    const steer = clamp(-angleDiff(desiredYaw, car.yaw) * 1.8, -1, 1);
    const dist = len2(dx, dz);
    const aligned = Math.abs(angleDiff(desiredYaw, car.yaw)) < 0.45;
    const throttle = dist > 1.3 ? 1 : 0.35;
    const ballDist = len2(ball.x - car.x, ball.z - car.z);
    const boost = aligned && ballDist < 9 && car.boost > 14 && ((isAlly ? ball.z > -6 : ball.z < 6) || run.timeLeft < 45) && run.kickoff <= 0;
    
    // Only set visual for main ai if we want, or handle boost visually in updateCar
    // aiBoostVisual is global. Let's ignore it for extra cars or let updateCar handle it.
    if (car === ai) aiBoostVisual = boost;
    
    const jump = ballDist < 2.1 && ball.y > 1.2 && car.onGround;
    updateCar(car, dt, steer, throttle, boost, jump, aiMul);
    
    // push car slightly if it's going for goal
    if (ballDist < 2.4 && (isAlly ? ball.z > car.z : ball.z < car.z) && (isAlly ? targetGoalZ < ball.z : targetGoalZ > ball.z)) {
      car.vx += (ball.x > car.x ? 1 : -1) * 0.08;
    }
  }

  let wallCueCooldown = 0;
  function wallThump`
);

// Also sync objects needs to sync extraCars meshes
code = code.replace(
  /syncCar\(ai\);/,
  `syncCar(ai);\n    for (const c of extraCars) syncCar(c);`
);

fs.writeFileSync('src/game/engine.ts', code);
