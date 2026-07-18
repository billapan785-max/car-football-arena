const fs = require('fs');
let engine = fs.readFileSync('src/game/engine.ts', 'utf8');

engine = engine.replace(
  'export function createGame(mount: HTMLElement, carOptions?: { color: number; accent: number, isOnline?: boolean, matchMode?: string, stadiumId?: string, teamColors?: {color: number, accent: number}[] }) {',
  'export function createGame(mount: HTMLElement, carOptions?: { color: number; accent: number, isOnline?: boolean, matchMode?: string, stadiumId?: string, teamColors?: {color: number, accent: number}[], modelUrl?: string }) {'
);

engine = engine.replace(
  'const playerVisual = createCarModel(playerColor, playerAccent, scale);',
  'const playerVisual = createCarModel(playerColor, playerAccent, scale, carOptions?.modelUrl || "/car.glb");'
);

fs.writeFileSync('src/game/engine.ts', engine, 'utf8');
console.log("Updated engine.ts again");
