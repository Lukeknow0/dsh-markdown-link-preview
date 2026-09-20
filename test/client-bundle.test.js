import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import vm from 'node:vm'
import test from 'node:test'

const run = promisify(execFile)
const root = new URL('..', import.meta.url)

test('builds the browser client as a DSH module-loader registration', async () => {
  await run(process.execPath, ['scripts/build.mjs'], { cwd: root })

  const client = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  const registrations = []
  vm.runInNewContext(client, {
    window: { __ModuleLoader__: { load: registration => registrations.push(registration) } },
  })

  assert.equal(registrations.length, 1)
  assert.equal(registrations[0].id, 'dsh-markdown-link-preview')
  assert.equal(typeof registrations[0].factory, 'function')
})
