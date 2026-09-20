const MARKDOWN_NAME = /\.md(?:own)?(?:$|[?#])/iu

export function isMarkdownOutputLink(anchor, locationHref) {
  if (!anchor?.getAttribute) return false
  const rawHref = anchor.getAttribute('href')
  if (!rawHref || rawHref.startsWith('#')) return false

  let url
  try {
    url = new URL(rawHref, locationHref)
  } catch {
    return false
  }
  if (!/^https?:$/iu.test(url.protocol)) return false

  const label = [
    anchor.textContent,
    anchor.getAttribute('title'),
    anchor.getAttribute('download'),
    decodeURIComponent(url.pathname.split('/').pop() ?? ''),
  ].filter(Boolean).join(' ')

  return MARKDOWN_NAME.test(url.pathname) || /\.md(?:own)?\b/iu.test(label)
}

export function extractMarkdownPath(text) {
  const normalized = String(text ?? '').replace(/\\/gu, '/').trim()
  // Tool rows render a relative workspace path after their action label.
  // Do not accept traversal or an absolute path: Better Sidebar will still
  // enforce its boundary, but the interceptor should stay conservative too.
  const match = normalized.match(/(?:^|\s|·|:)([\w.\- /]+\.md(?:own)?)(?:\s|$)/iu)
  if (!match) return null
  const path = match[1].trim().replace(/^\.\//u, '')
  if (path === '' || path.startsWith('/') || path.split('/').some(part => part === '..')) return null
  return path
}

export function isSafePreviewUrl(href, locationHref) {
  try {
    const url = new URL(href, locationHref)
    const page = new URL(locationHref)
    return url.origin === page.origin && /^https?:$/iu.test(url.protocol)
  } catch {
    return false
  }
}

export function markdownTabSeed(url, title) {
  const key = Array.from(new TextEncoder().encode(url)).reduce(
    (hash, byte) => ((hash * 33) ^ byte) >>> 0,
    5381,
  ).toString(36)
  return {
    type: 'markdown-link-preview',
    id: `markdown-link-preview:${key}`,
    title: title || 'Markdown',
    meta: { url },
  }
}

export function displayName(anchor, href, locationHref) {
  const label = String(anchor?.textContent ?? '').trim().replace(/\s+/gu, ' ')
  if (label) return label.length > 64 ? `${label.slice(0, 61)}…` : label
  try {
    return decodeURIComponent(new URL(href, locationHref).pathname.split('/').pop() || 'Markdown')
  } catch {
    return 'Markdown'
  }
}
