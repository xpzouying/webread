# readlite

HTML → clean Markdown CLI for AI consumption. Built on [Defuddle](https://github.com/kepano/defuddle) + [Turndown](https://github.com/mixmark-io/turndown).

readlite reads HTML on stdin and writes clean markdown on stdout. To turn a *URL* into markdown end-to-end, you need a tool that fetches the page first (with cookies, post-JS rendering, etc.). The intended companion is **[kimi-webbridge](https://www.kimi.com/features/webbridge)** ([中文](https://www.kimi.com/zh-cn/features/webbridge)) — a Chrome extension + local daemon that drives your real browser, so AI agents can fetch pages with your actual login sessions. **Without kimi-webbridge (or an equivalent fetcher), readlite has no input.**

## Install

```bash
pnpm install && pnpm build
npm link  # optional: makes `readlite` globally available
```

## Use

```bash
cat page.html | readlite [URL] [--no-images] [--inline-links] > out.md
```

| Flag | Behavior |
|---|---|
| `URL` (positional) | Source URL — resolves relative links, triggers site rules |
| `--no-images` | Strip image lines (token savings for AI) |
| `--inline-links` | Inline link style (default: reference-style) |

Exits `0` on success, `1` on form failure (extraction returned empty / threw).

## Site rules

Per-domain clean-up rules in [`src/site-rules/`](./src/site-rules/). Active: `mp.weixin.qq.com`, `*.sina.com.cn`. URLs without a matching rule go through the universal pipeline.

To add a rule for a misbehaving site → [`docs/site-rules.md`](./docs/site-rules.md).
