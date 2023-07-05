import typescript from '@rollup/plugin-typescript';

export default {
  input: 'index.ts',
  output: [
    {
      name: 'index',
      file: 'index.js',
      format: 'cjs',
    },
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.build.json' }),
  ],
};
