import process from 'node:process';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { defineConfig } from 'rollup';
import { defineRollupSwcOption, swc } from 'rollup-plugin-swc3';

import metablock from 'rollup-plugin-userscript-metablock';
import pkgJson from './package.json';

const CONFIG_UI_HOST = process.env.CONFIG_UI_HOST || 'location-guard-neo.pages.dev';
const CONFIG_UI_ORIGIN = process.env.CONFIG_UI_ORIGIN || `https://${CONFIG_UI_HOST}`;
const DIST_BASE_URL = process.env.DIST_BASE_URL || 'https://unpkg.com/location-guard@latest/dist';

const userScriptMetaBlockConfig = {
  file: './userscript.meta.json',
  override: {
    version: pkgJson.version,
    description: pkgJson.description,
    author: pkgJson.author,
    namespace: CONFIG_UI_ORIGIN,
    updateURL: `${DIST_BASE_URL}/location-guard-neo.meta.js`,
    downloadURL: `${DIST_BASE_URL}/location-guard-neo.user.js`,
  },
};

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [{
      format: 'iife',
      file: 'dist/location-guard-neo.user.js',
      sourcemap: false,
      esModule: false,
      compact: true,
      generatedCode: 'es2015',
    }],
    plugins: [
      swc(defineRollupSwcOption({
        jsc: {
          target: 'es2020',
          externalHelpers: true,
        },
      })),
      commonjs({
        sourceMap: false,
        esmExternals: true,
      }),
      nodeResolve({
        exportConditions: ['import', 'require', 'default'],
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify('production'),
          'typeof window': JSON.stringify('object'),
          '__CONFIG_UI_ORIGIN__': JSON.stringify(CONFIG_UI_ORIGIN),
          '__CONFIG_UI_HOST__': JSON.stringify(CONFIG_UI_HOST),
        },
      }),
      alias({
        entries: {
          '@mui/joy': '@mui/joy/modern',
          '@mui/styled-engine': '@mui/styled-engine/modern',
          '@mui/system': '@mui/system/modern',
          '@mui/base': '@mui/base/modern',
          '@mui/utils': '@mui/utils/modern',
          '@mui/lab': '@mui/lab/modern',
        },
      }),
      metablock(userScriptMetaBlockConfig),
    ],
    watch: process.env.WATCH
      ? {}
      : false,
    external: ['typed-query-selector'],
  },
  {
    input: 'src/dummy.js',
    output: [{
      file: 'dist/location-guard-neo.meta.js',
    }],
    plugins: [
      metablock(userScriptMetaBlockConfig),
    ],
  },
]);
