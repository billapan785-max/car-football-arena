const fs = require('fs');
const buffer = fs.readFileSync('public/paganizondacinque.glb');
// We just need to check if there is KTX2 or DRACO in the file
const content = buffer.toString('utf8');
if (content.includes('KHR_draco_mesh_compression')) {
  console.log("Draco compression detected!");
}
if (content.includes('KHR_texture_basisu')) {
  console.log("KTX2 textures detected!");
}
if (content.includes('EXT_meshopt_compression')) {
  console.log("Meshopt compression detected!");
}
