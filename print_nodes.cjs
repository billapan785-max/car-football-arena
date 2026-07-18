const fs = require('fs');
const buffer = fs.readFileSync('public/paganizondacinque.glb');
let offset = 12;
let jsonChunk = null;
const length = buffer.readUInt32LE(8);

while (offset < length) {
  const chunkLength = buffer.readUInt32LE(offset);
  const chunkType = buffer.toString('utf8', offset + 4, offset + 8);
  if (chunkType === 'JSON') {
    jsonChunk = buffer.toString('utf8', offset + 8, offset + 8 + chunkLength);
    break;
  }
  offset += 8 + chunkLength;
}

const gltf = JSON.parse(jsonChunk);
if (gltf.nodes) {
  gltf.nodes.forEach(n => {
    console.log("Node:", n.name);
    if (n.rotation) console.log("  Rotation:", n.rotation);
    if (n.scale) console.log("  Scale:", n.scale);
    if (n.translation) console.log("  Translation:", n.translation);
  });
}
