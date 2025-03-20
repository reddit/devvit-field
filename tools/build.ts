#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
// Bundles sources to webroot/index.js.
//
// build.ts [--dev-mode] [--minify] [--watch]
// --dev-mode  Run development server. Serve on http://localhost:1234 and reload
//             on code change.
// --minify    Minify output.
// --watch     Automatically rebuild whenever an input changes.

import fs from 'node:fs'
import esbuild from 'esbuild'
import type {BuildOptions} from 'esbuild'
import pkg from '../package.json' with {type: 'json'}

const devMode = process.argv.includes('--dev-mode')
const minify = process.argv.includes('--minify')
const watch = process.argv.includes('--watch')

const buildOpts: BuildOptions = {
  banner: devMode
    ? {
        js: 'new EventSource("/esbuild").addEventListener("change", () => location.reload());',
      }
    : {},
  bundle: true,
  define: {devMode: `${devMode}`, version: `'${pkg.version}'`},
  entryNames: '[name]', // Don't output subdirs.
  entryPoints: [
    'src/iframe/index.ts',
    'src/iframe/part-data/part-data-worker.ts',
  ],
  format: 'esm',
  logLevel: 'info', // Print the port and build demarcations.
  metafile: true,
  minify,
  outdir: 'webroot',
  sourcemap: devMode && 'linked', // Don't upload sourcemaps in prod.
  target: 'es2022', // https://esbuild.github.io/content-types/#tsconfig-json
  write: !devMode, // Never record dev mode which is incompatible with prod.
}

if (devMode || watch) {
  const ctx = await esbuild.context(buildOpts)
  await Promise.all([
    ctx.watch(),
    devMode ? ctx.serve({port: 1234, servedir: 'webroot'}) : undefined,
  ])
} else {
  const {metafile} = await esbuild.build(buildOpts)
  fs.mkdirSync('dist/iframe', {recursive: true})
  fs.writeFileSync('dist/iframe/index.meta.json', JSON.stringify(metafile))
}
