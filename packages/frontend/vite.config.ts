import { resolve } from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [react()],
    resolve: {
      alias: {
        src: resolve(__dirname, './src'),
        'src/*': resolve(__dirname, './src/*'),
        '@webcam/common': resolve(__dirname, '../common/src'),
      },
    },
    build: {
      rollupOptions: {
        external: /\.test/,
      },
    },
  };
});
