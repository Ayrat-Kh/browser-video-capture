import { defineConfig } from 'vitest/config';

import { resolve } from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
      'src/*': resolve(__dirname, './src/*'),
      '@webcam/common': resolve(__dirname, '../common/src'),
    },
  },
});
