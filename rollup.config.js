import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const dev = process.env.ROLLUP_WATCH === 'true';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: dev,
    // Multi-chunk so the heavy <model-viewer> only loads when the floor3d
    // card is actually rendered. HACS users get the main bundle right away;
    // additional chunks live alongside it in the same plugin directory and
    // are resolved by the browser when dynamic imports fire.
    entryFileNames: 'redchupa-cards.js',
    chunkFileNames: 'redchupa-cards-[name].js',
  },
  plugins: [
    resolve({ browser: true }),
    typescript({ tsconfig: './tsconfig.json' }),
    !dev && terser({ format: { comments: false } }),
  ],
  // Main-entry target: < 300KB gzip (see PLAN.md §9). Chunks are checked
  // for sanity in CI but not held to the same hard ceiling.
};
