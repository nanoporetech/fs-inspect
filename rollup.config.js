import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript(),
    resolve()
  ],
  output: [
    {
      file: `dist/${pkg.main}`,
      format: 'cjs'
    },
    {
      file: `dist/${pkg.module}`,
      format: 'esm'
    }
  ],
  external: ['fs']
};