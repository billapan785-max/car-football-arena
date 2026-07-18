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
if (gltf.images && gltf.bufferViews) {
  gltf.images.forEach((img, i) => {
    if (img.bufferView !== undefined) {
      const bv = gltf.bufferViews[img.bufferView];
      const imgData = binChunk.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
      // check if it's png or jpeg
      if (imgData[0] === 0x89 && imgData[1] === 0x50 && imgData[2] === 0x4E && imgData[3] === 0x47) {
        // PNG
        const w = imgData.readUInt32BE(16);
        const h = imgData.readUInt32BE(20);
        console.log(`Image ${i} (PNG): ${w}x${h}, size: ${imgData.length} bytes`);
      } else if (imgData[0] === 0xFF && imgData[1] === 0xD8) {
        // JPEG
        let o = 2;
        while (o < imgData.length) {
          if (imgData[o] === 0xFF) {
            const marker = imgData[o+1];
            if (marker === 0xC0 || marker === 0xC2) { // SOF0 or SOF2
              const h = imgData.readUInt16BE(o+5);
              const w = imgData.readUInt16BE(o+7);
              console.log(`Image ${i} (JPEG): ${w}x${h}, size: ${imgData.length} bytes`);
              break;
            } else {
              o += 2 + imgData.readUInt16BE(o+2);
            }
          } else {
            o++;
          }
        }
      }
    }
  });
}
