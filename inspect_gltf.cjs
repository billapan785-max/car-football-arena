const fs = require('fs');

const buffer = fs.readFileSync('public/paganizondacinque.glb');

const magic = buffer.toString('utf8', 0, 4);
if (magic !== 'glTF') {
  console.log("Not a valid glTF binary.");
  process.exit(1);
}

const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

let offset = 12;
let jsonChunk = null;
let binChunk = null;

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

if (!jsonChunk) {
  console.log("No JSON chunk found.");
  process.exit(1);
}

const gltf = JSON.parse(jsonChunk);

console.log("GLTF Asset:", gltf.asset);
console.log("Extensions Used:", gltf.extensionsUsed || "None");
console.log("Extensions Required:", gltf.extensionsRequired || "None");
console.log("Number of nodes:", gltf.nodes ? gltf.nodes.length : 0);
console.log("Number of meshes:", gltf.meshes ? gltf.meshes.length : 0);
console.log("Number of materials:", gltf.materials ? gltf.materials.length : 0);
console.log("Number of textures:", gltf.textures ? gltf.textures.length : 0);

if (gltf.extensionsRequired && gltf.extensionsRequired.includes('KHR_draco_mesh_compression')) {
    console.log("WARNING: Requires DRACO compression!");
}
if (gltf.extensionsRequired && gltf.extensionsRequired.includes('KHR_texture_basisu')) {
    console.log("WARNING: Requires KTX2 texture compression!");
}

