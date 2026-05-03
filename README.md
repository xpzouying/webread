# readlite

> Turn any web page into clean Markdown — for AI agents and humans alike.

readlite extracts the article body and drops everything else: navigation, ads, comment widgets, recommendation cards, sidebars. Works on English and Chinese pages, with built-in tuning for high-volume Chinese sites like **微信公众号** and **新浪新闻**.

## What you get

| Source | HTML | Markdown | Reduction |
|---|---|---|---|
| 微信公众号 article | 4.0 MB | 24 KB | **×159** |
| 新浪新闻 article | 115 KB | 0.6 KB | **×180** |
| Anthropic docs (English) | 1.8 MB | 38 KB | ×47 |
| OpenAI docs (English) | 269 KB | 9 KB | ×28 |

Images preserved as direct CDN links · code blocks intact · links collected at the end (reference-style).

## Install

```bash
npm install -g readlite
```

Or use without installing: `npx readlite ...`

## Use

readlite reads HTML on stdin. To turn a *URL* into markdown end-to-end, pair it with **[kimi-webbridge](https://www.kimi.com/features/webbridge)** ([中文](https://www.kimi.com/zh-cn/features/webbridge)) — a Chrome extension that drives your real browser, so you (or your AI agent) can fetch pages with your actual login sessions and post-JS-rendered DOM. **kimi-webbridge is required**: without it, readlite has no input.

```bash
cat page.html | readlite https://your-url > article.md
```

### Flags

| Flag | Behavior |
|---|---|
| `URL` (positional) | Source URL — used for relative-link resolution and to trigger site rules |
| `--no-images` | Strip image lines (saves tokens for AI) |
| `--inline-links` | Inline link style (default is reference-style) |

## Built-in site tuning

For sites with quirky layouts that confuse generic extractors, readlite ships per-site rules. Currently tuned: `mp.weixin.qq.com`, `*.sina.com.cn`. URLs without a matching rule go through the universal pipeline (which already handles most well-structured pages).

If your favorite site produces poor output → [add a rule](./docs/site-rules.md) (6-step template recipe).

## License

MIT
