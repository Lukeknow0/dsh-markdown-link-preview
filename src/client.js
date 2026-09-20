import React, { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { displayName, extractMarkdownPath, isMarkdownOutputLink, isSafePreviewUrl, markdownTabSeed } from './core.js'

export const inject = ['betterSidebar']

const TAB_ID = 'markdown-link-preview'

const styles = `
.dsh-md-link-preview { height:100%; overflow:auto; padding:20px 24px 48px; box-sizing:border-box; color:var(--dsw-alias-label-primary,inherit); }
.dsh-md-link-preview__title { font-size:14px; font-weight:650; margin:0 0 16px; overflow-wrap:anywhere; }
.dsh-md-link-preview__status { color:var(--dsw-alias-label-secondary,#777); padding:18px 0; }
.dsh-md-link-preview__error { color:var(--dsw-alias-state-warn-primary,#b33); white-space:pre-wrap; }
.dsh-md-link-preview__body { font-size:14px; line-height:1.72; overflow-wrap:anywhere; }
.dsh-md-link-preview__body pre { overflow:auto; padding:12px; border-radius:8px; background:rgba(127,127,127,.12); }
.dsh-md-link-preview__body code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-md-link-preview__body table { border-collapse:collapse; display:block; max-width:100%; overflow:auto; }
.dsh-md-link-preview__body th,.dsh-md-link-preview__body td { border:1px solid rgba(127,127,127,.28); padding:6px 9px; }
.dsh-md-link-preview__body img { height:auto; max-width:100%; }
.dsh-md-link-preview__body a { color:var(--dsw-alias-link-primary,#3b82f6); }
`

function installStyles() {
  const id = 'dsh-markdown-link-preview-style'
  if (document.getElementById(id)) return () => {}
  const style = document.createElement('style')
  style.id = id
  style.textContent = styles
  document.head.append(style)
  return () => style.remove()
}

function renderMarkdown(source, baseUrl) {
  const html = marked.parse(source, { async: false, gfm: true, breaks: false })
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  })
  const template = document.createElement('template')
  template.innerHTML = clean
  for (const element of template.content.querySelectorAll('a[href], img[src]')) {
    const attribute = element.tagName === 'A' ? 'href' : 'src'
    const value = element.getAttribute(attribute)
    if (!value) continue
    try { element.setAttribute(attribute, new URL(value, baseUrl).href) } catch { element.removeAttribute(attribute) }
    if (element.tagName === 'A') {
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noopener noreferrer')
    }
  }
  return template.innerHTML
}

function MarkdownLinkPreview({ tab, visible }) {
  const url = tab.meta?.url
  const [state, setState] = useState({ loading: true, source: '', error: '' })

  useEffect(() => {
    if (!visible || typeof url !== 'string') return undefined
    const controller = new AbortController()
    setState({ loading: true, source: '', error: '' })
    fetch(url, { credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`)
        return response.text()
      })
      .then(source => setState({ loading: false, source, error: '' }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ loading: false, source: '', error: error.message || 'Unable to load Markdown' })
      })
    return () => controller.abort()
  }, [url, visible])

  const html = useMemo(() => state.source ? renderMarkdown(state.source, url) : '', [state.source, url])
  return React.createElement('article', { className: 'dsh-md-link-preview' },
    React.createElement('h1', { className: 'dsh-md-link-preview__title' }, tab.title),
    state.loading && React.createElement('p', { className: 'dsh-md-link-preview__status' }, '正在加载 Markdown…'),
    state.error && React.createElement('p', { className: 'dsh-md-link-preview__error' }, `无法预览：${state.error}`),
    !state.loading && !state.error && React.createElement('div', {
      className: 'dsh-md-link-preview__body',
      dangerouslySetInnerHTML: { __html: html },
    }),
  )
}

export function apply(ctx) {
  const sidebar = ctx.get('betterSidebar')
  if (!sidebar) throw new Error('dsh-markdown-link-preview requires dsh-better-sidebar')

  ctx.effect(installStyles, 'dsh-markdown-link-preview: styles')
  ctx.effect(() => sidebar.registerTab({
    id: TAB_ID,
    title: 'Markdown 预览',
    hidden: true,
    dedupeKey: tab => tab.id,
    component: MarkdownLinkPreview,
  }), 'dsh-markdown-link-preview: sidebar tab')

  ctx.effect(() => {
    const onClick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const source = event.target instanceof Element
        ? event.target.closest('a[href], button, [role="button"], [data-file-path]')
        : null
      if (!source || source.closest('[data-dsh-markdown-link-preview-ignore]')) return

      const href = source.getAttribute('href')
      if (href && isSafePreviewUrl(href, window.location.href) && isMarkdownOutputLink(source, window.location.href)) {
        event.preventDefault()
        event.stopPropagation()
        const url = new URL(href, window.location.href).href
        sidebar.openTab(markdownTabSeed(url, displayName(source, href, window.location.href)))
        return
      }

      // DSH tool rows expose workspace file references as buttons rather than
      // anchors (for example: "读取 · docs/README.md"). Route those paths
      // through Better Sidebar's native file opener, which picks its Markdown
      // viewer and preserves the session workspace boundary.
      const path = source.getAttribute('data-file-path') || extractMarkdownPath(source.textContent)
      const sessionId = sidebar.getSnapshot?.().sessionId
      if (!path || !sessionId || !sidebar.features?.includes('openFile')) return
      event.preventDefault()
      event.stopPropagation()
      sidebar.openFile({ sessionId }, path)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, 'dsh-markdown-link-preview: output link interceptor')
}
