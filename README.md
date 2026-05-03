# readlite

> Turn any web page into clean Markdown — for AI agents and humans alike.

readlite extracts the article body and drops everything else: navigation, ads, comment widgets, recommendation cards, sidebars. Works on English and Chinese pages, with built-in tuning for high-volume Chinese sites like **微信公众号** and **新浪新闻**.

## What it does

You give readlite a typical web page — full of navigation, ads, sidebars, comment widgets, recommendation cards, footer junk:

```html
<html><body>
  <nav>Sign in · Subscribe · About</nav>
  <header><img src="banner-ad.jpg"></header>
  <article>
    <h1>How prompt caching works</h1>
    <p>Prompt caching lets you reuse common prefixes across requests…</p>
    <pre><code class="python">client.messages.create({...})</code></pre>
  </article>
  <aside>
    <h3>Related posts</h3><ul>…</ul>
    <h3>Comments (42)</h3>…
  </aside>
  <footer>© 2026 · Privacy · Terms</footer>
</body></html>
```

You get back the article — clean Markdown, ready to feed an LLM:

````markdown
# How prompt caching works

Prompt caching lets you reuse common prefixes across requests…

```python
client.messages.create({...})
```
````

Tested on **微信公众号**, **新浪新闻**, Anthropic / OpenAI docs, and many others. Code blocks, images, and inline links are preserved; nav, sidebar, comments, footer, and recommendation widgets are stripped.

## Install

```bash
npm install -g @xpzouying/readlite
```

Or use without installing: `npx @xpzouying/readlite ...`

After install, the command is just `readlite`.

## Use

readlite reads HTML on stdin. To fetch URLs end-to-end, pair it with **[kimi-webbridge](https://www.kimi.com/features/webbridge)** ([中文](https://www.kimi.com/zh-cn/features/webbridge)) — the page fetcher we use. **Without kimi-webbridge, readlite has no input.**

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
