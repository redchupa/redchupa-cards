import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const dev = process.env.ROLLUP_WATCH === 'true';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/redchupa-cards.js',
    format: 'es',
    sourcemap: dev,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({ browser: true }),
    typescript({ tsconfig: './tsconfig.json' }),
    !dev && terser({ format: { comments: false } }),
  ],
  // Card bundle target: < 300KB gzip (see PLAN.md §9)
};
