import { rmSync } from 'node:fs'
import { build } from 'esbuild'

rmSync('lib', { recursive: true, force: true })
const shared = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  external: ['react', 'dsh-better-sidebar'],
}
await Promise.all([
  build({ ...shared, entryPoints: ['src/index.js'], outfile: 'lib/index.js' }),
  build({ ...shared, entryPoints: ['src/client.js'], outfile: 'lib/client.js' }),
])
