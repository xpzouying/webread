# readlite

HTML → clean Markdown CLI for AI consumption. Built on [Defuddle](https://github.com/kepano/defuddle) + [Turndown](https://github.com/mixmark-io/turndown).

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

### With kimi-webbridge

```bash
URL="https://..."
curl -s localhost:10086/command -d "{\"action\":\"navigate\",\"args\":{\"url\":\"$URL\"}}" >/dev/null
sleep 3
curl -s localhost:10086/command -d '{"action":"evaluate","args":{"code":"document.documentElement.outerHTML"}}' \
  | jq -r '.data.value' | readlite "$URL" > out.md
```

## Site rules

Per-domain clean-up rules in [`src/site-rules/`](./src/site-rules/). Active: `mp.weixin.qq.com`, `*.sina.com.cn`. URLs without a matching rule go through the universal pipeline.

To add a rule for a misbehaving site → [`docs/site-rules.md`](./docs/site-rules.md).
