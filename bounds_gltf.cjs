const fs = require('fs');

const buffer = fs.readFileSync('public/paganizondacinque.glb');

let offset = 12;
let jsonChunk = null;
let binChunk = null;
const length = buffer.readUInt32LE(8);

while (offset < length) {
  const chunkLength = buffer.readUInt32LE(offset);
  const chunkType = buffer.toString('utf8', offset + 4, offset + 8);
  if (chunkType === 'JSON') {
    jsonChunk = buffer.toString('utf8', offset + 8, offset + 8 + chunkLength);
  } else if (chunkType === 'BIN\0') {
    binChunk = buffer.subarray(offset + 8, offset + 8 + chunkLength);
  }
  offset += 8 + chunkLength;
}

const gltf = JSON.parse(jsonChunk);
let min = [Infinity, Infinity, Infinity];
let max = [-Infinity, -Infinity, -Infinity];

if (gltf.accessors) {
  for (let i = 0; i < gltf.accessors.length; i++) {
    const acc = gltf.accessors[i];
    if (acc.type === 'VEC3' && acc.min && acc.max) {
      if (acc.min[0] < min[0]) min[0] = acc.min[0];
      if (acc.min[1] < min[1]) min[1] = acc.min[1];
      if (acc.min[2] < min[2]) min[2] = acc.min[2];
      
      if (acc.max[0] > max[0]) max[0] = acc.max[0];
      if (acc.max[1] > max[1]) max[1] = acc.max[1];
      if (acc.max[2] > max[2]) max[2] = acc.max[2];
    }
  }
}

console.log("Global bounds:");
console.log("Min:", min);
console.log("Max:", max);
console.log("Size:", [max[0]-min[0], max[1]-min[1], max[2]-min[2]]);
