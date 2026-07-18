import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Auto-copy football.glb to public if user uploaded it to the root folder
  try {
    const rootPath = path.resolve(__dirname, 'football.glb');
    const publicPath = path.resolve(__dirname, 'public/football.glb');
    if (fs.existsSync(rootPath)) {
      fs.copyFileSync(rootPath, publicPath);
      console.log('Successfully copied football.glb from root to public folder.');
    }
  } catch (e) {
    console.error('Error copying football.glb:', e);
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
