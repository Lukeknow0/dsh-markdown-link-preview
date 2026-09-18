import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { displayName, isMarkdownOutputLink, isSafePreviewUrl, markdownTabSeed } from '../src/core.js'

const page = 'http://127.0.0.1:3080/'
const anchor = (html) => new JSDOM(html).window.document.querySelector('a')

test('recognizes markdown paths and visible markdown filenames', () => {
  assert.equal(isMarkdownOutputLink(anchor('<a href="/files/brief.md">Brief</a>'), page), true)
  assert.equal(isMarkdownOutputLink(anchor('<a href="/download?id=7">Brief.md</a>'), page), true)
  assert.equal(isMarkdownOutputLink(anchor('<a href="/files/report.pdf">Report.pdf</a>'), page), false)
})

test('allows only same-origin http(s) URLs', () => {
  assert.equal(isSafePreviewUrl('/download/brief.md', page), true)
  assert.equal(isSafePreviewUrl('https://example.com/brief.md', page), false)
  assert.equal(isSafePreviewUrl('javascript:alert(1)', page), false)
})

test('creates deterministic, URL-specific tab seeds', () => {
  const first = markdownTabSeed('http://127.0.0.1:3080/a.md', 'A.md')
  const second = markdownTabSeed('http://127.0.0.1:3080/b.md', 'B.md')
  assert.equal(first.type, 'markdown-link-preview')
  assert.notEqual(first.id, second.id)
  assert.equal(first.meta.url, 'http://127.0.0.1:3080/a.md')
})

test('uses the displayed filename as a tab title', () => {
  assert.equal(displayName(anchor('<a href="/download/brief.md">\n Brief.md \n</a>'), '/download/brief.md', page), 'Brief.md')
})
