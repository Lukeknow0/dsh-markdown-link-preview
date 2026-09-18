# DSH Markdown Link Preview

[![DSH](https://img.shields.io/badge/DSH-plugin-4d6bfe)](https://github.com/deepseek-ai/dsh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

让 DSH 聊天消息中的同源 `.md` 输出文件直接在 **DSH Better Sidebar** 中渲染，而不是唤起系统默认 App。

## 功能

- 捕获聊天区中指向同源 Markdown 文件的普通左键点击。
- 每个文档在侧边栏中开独立标签，可并排阅读多个输出。
- GitHub Flavored Markdown、代码块、表格、图片与相对链接渲染。
- `marked` 输出经 DOMPurify 清洗；仅接管与 DSH 页面同源的 HTTP(S) URL。
- `Cmd/Ctrl` 点击、右键、新窗口操作完全保留原始浏览器行为。

## 安装

前提：已安装并启用 [`dsh-better-sidebar`](https://github.com/omdsh-dev/DSH-better-sidebar)。

```bash
dsh plugin --profile web add github:Lukeknow0/dsh-markdown-link-preview
```

重启或刷新 DSH Web 后，直接点击聊天中的 `.md` 输出文件即可预览。

## 开发

```bash
npm install
npm test
npm run build
npm pack --dry-run
```

## 安全边界

插件不会接管跨域链接、`file:`、`data:` 或 `javascript:` URL。Markdown HTML 在渲染前会被 DOMPurify 清洗。该插件不上传文档内容，也不增加任何远程服务。

## 贡献

欢迎提交 Issue / PR。若它解决了你在 DSH 里阅读产出文档的痛点，欢迎点一个 Star ⭐。

## License

[MIT](LICENSE)
