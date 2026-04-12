import {defineConfig} from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'v0_9/index': 'src/v0_9/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['vue'],
  platform: 'browser',
  target: 'es2022',
});
