import { defineConfig, Options } from 'tsup'

// @ts-ignore
export default defineConfig((options) => {

  const commonOptions: Partial<Options> = {
    entry: {
      'config': 'src/index.ts'
    },
    sourcemap: true,
    target: 'es2016',
    ...options,
  }

  return [
    // Standard ESM, embedded `process.env.NODE_ENV` checks
    {
      ...commonOptions,
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      dts: true,
      clean: true,
    },
    {
      ...commonOptions,
      format: ['cjs'],
      outExtension: () => ({ js: '.cjs' }),
      dts: true,
      clean: true,
    },
    // Support Webpack 4 by pointing `"module"` to a file with a `.js` extension
    {
      ...commonOptions,
      entry: {
        'config.legacy-esm': 'src/index.ts',
      },
      target: 'es2017',
      format: ['esm'],
      outExtension: () => ({ js: '.js' }),
    },
  ]
})