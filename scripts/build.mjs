import { rmSync } from 'node:fs'
import { build } from 'esbuild'

rmSync('lib', { recursive: true, force: true })
const shared = {
  bundle: true,
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
}
await Promise.all([
  build({ ...shared, format: 'esm', entryPoints: ['src/index.js'], outfile: 'lib/index.js' }),
  build({
    ...shared,
    format: 'cjs',
    external: ['react'],
    banner: {
      js: 'window.__ModuleLoader__.load({ id: "dsh-markdown-link-preview", factory(require) { var module = { exports: {} }; var exports = module.exports;',
    },
    footer: {
      js: 'return module.exports; } });',
    },
    entryPoints: ['src/client.js'],
    outfile: 'lib/client.js',
  }),
])
