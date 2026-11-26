import { resolve, relative } from 'path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const { NODE_ENV = 'development' } = process.env;

const config = defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8081,
  },
  preview: {
    port: 8081,
  },
  build: {
    target: 'es6',
    rollupOptions: {
      external: ['vue'],

      input: 'src/index.ts',
      preserveEntrySignatures: 'strict',
      output: {
        entryFileNames: 'index.js',
        dir: resolve(__dirname, 'dist/'),
        format: 'esm',
      },
    },
  },
  experimental: {
    renderBuiltUrl() {
      return { relative: true };
    },
  },
});

function addDebugConfig() {
  config.mode = 'development';

  if (config.build === undefined) {
    return;
  }

  config.build.minify = false;
  config.build.sourcemap = true;

  if (config.build.rollupOptions?.output === undefined || Array.isArray(config.build.rollupOptions.output)) {
    return;
  }

  config.build.rollupOptions.output.manualChunks = (id) => {
    if (id.includes('node_modules')) {
      return 'node_modules';
    }

    const relativePath = relative('./', id);
    if (relativePath.startsWith('..')) {
      console.error('Do not import files outside of this project: ' + relativePath);
      return 'external';
    }

    const result = relativePath.startsWith('.') ? relativePath.substring(2) : relativePath;
    return result;
  };
}

if (NODE_ENV === 'development') {
  addDebugConfig();
}

export default config;
