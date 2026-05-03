# readify

Minimal HTML→Markdown CLI for AI consumption. Reads HTML on stdin, outputs clean markdown on stdout.

Built on [Defuddle](https://github.com/kepano/defuddle) (content extraction) + Turndown (markdown conversion).

## Install

```bash
pnpm install
pnpm build
npm link  # optional: makes `readify` globally available
```

## Usage

```bash
# Pipe HTML in, get markdown out
cat page.html | readify https://example.com/article > out.md

# Skip images for AI consumption (saves tokens)
cat page.html | readify https://example.com/article --no-images

# Inline-style links (instead of reference-style default)
cat page.html | readify --inline-links

# Pair with kimi-webbridge to fetch URLs
curl -s localhost:10086/command \
  -d '{"action":"navigate","args":{"url":"https://example.com"}}'
curl -s localhost:10086/command \
  -d '{"action":"evaluate","args":{"code":"document.documentElement.outerHTML"}}' \
  | jq -r '.data.value' \
  | readify https://example.com
```

## Flags

| Flag | Default | Behavior |
|---|---|---|
| (positional) URL | none | Source URL for relative link resolution and Defuddle metadata |
| `--no-images` | off | Strip `![alt](url)` lines |
| `--inline-links` | off | Switch from reference to inline link style |

## Exit codes

- `0` — success
- `1` — form failure (extraction threw, returned null, empty, or whitespace-only content)

## Design philosophy

readify is a **pure function**: HTML on stdin, markdown on stdout. No file writes, no network I/O. Fetching is the caller's job. This separation keeps the CLI testable and composable.

See `/Users/moonshot/.claude/plans/learn-skills-curious-reef.md` for design rationale.
