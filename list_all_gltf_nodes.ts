import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).URL = dom.window.URL;
(global as any).self = dom.window;

const gltfBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'car.glb'));
const arrayBuffer = gltfBuffer.buffer.slice(gltfBuffer.byteOffset, gltfBuffer.byteOffset + gltfBuffer.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuffer, '', (gltf) => {
  console.log("--- GLTF SCENE NODES ---");
  gltf.scene.traverse((child: any) => {
    console.log(`- ${child.type}: ${child.name} (hasMaterial: ${!!child.material}, materialName: ${child.material?.name})`);
  });
}, (err) => {
  console.error("Error parsing gltf:", err);
});
