import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import {createRequire} from 'node:module';
import {defineConfig} from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

import viteMonorepoResolutionPlugin from '../shared/lexicalMonorepoPlugin';
import viteCopyEsm from './viteCopyEsm';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  build: {
    outDir: 'build-esm-v2',
    lib: {
      entry: resolve(__dirname, 'src/esm-entry-v2.tsx'),
      name: 'LexicalPlaygroundV2',
      fileName: 'lexical-playground-v2',
      formats: ['es'],
    },
    rollupOptions: {
      // Not externalizing React/ReactDOM so they are bundled into the ESM
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    ...(mode === 'production' && {
      minify: 'terser',
      terserOptions: {
        compress: {
          toplevel: true,
        },
        keep_classnames: true,
      },
    }),
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
      treeShaking: true,
    },
  },
  plugins: [
    viteMonorepoResolutionPlugin(),
    babel({
      babelHelpers: 'bundled',
      babelrc: false,
      configFile: false,
      exclude: '**/node_modules/**',
      extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
      plugins: [
        '@babel/plugin-transform-flow-strip-types',
      ],
      presets: [['@babel/preset-react', {runtime: 'automatic'}]],
    }),
    react(),
    viteCopyEsm(),
    commonjs({
      strictRequires: [/\/node_modules\/(react-dom|react)\/[^/]\.js$/],
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    'process.env': JSON.stringify({}),
    'process': JSON.stringify({ env: { NODE_ENV: mode === 'production' ? 'production' : 'development' } }),
    global: 'globalThis',
  }
}));
