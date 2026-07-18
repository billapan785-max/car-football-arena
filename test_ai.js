const FIELD_L = 40;
const ball = { z: 5 };
const ai = { z: 0 };
const behind = ball.z > ai.z ? -2.4 : 2.2;
const targetZ = ball.z + behind;
console.log(targetZ);
