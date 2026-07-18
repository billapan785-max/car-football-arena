const fs = require('fs');
const buffer = fs.readFileSync('public/paganizondacinque.glb');
const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);
console.log("Magic:", magic);
console.log("Version:", version);
console.log("Length:", length);
