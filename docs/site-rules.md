# Adding a site rule

When a page produces poor markdown, add a rule.

1. **Capture HTML** to `test/fixtures/<name>/input.html` (also save URL to `url.txt`):
   ```bash
   curl -s localhost:10086/command -d "{\"action\":\"navigate\",\"args\":{\"url\":\"$URL\"}}" >/dev/null
   sleep 3
   curl -s localhost:10086/command -d '{"action":"evaluate","args":{"code":"document.documentElement.outerHTML"}}' \
     | jq -r '.data.value' > test/fixtures/<name>/input.html
   ```

2. **Reproduce** the failure: `cat test/fixtures/<name>/input.html | node dist/cli.js "<URL>"` — note what's wrong.

3. **Write the rule** at `src/site-rules/<name>.ts` (copy `wechat-mp.ts` or `sina-news.ts`). Pick hook(s):
   - `preProcess(doc, url)` — DOM transforms (remove sidebars, lift article container)
   - `defuddleOptions` — override Defuddle config (e.g. `contentSelector`)
   - `postProcess(md, url)` — markdown cleanup

4. **Register** in `src/site-rules/index.ts` (more specific rules first; first match wins).

5. **Test** at `test/site-rules/<name>.test.ts` — three assertions required:
   - **Match** — matcher accepts the URL, rejects others
   - **Improvement** — a measurable signal improves
   - **Non-regression** — same fixture with a non-matching URL is unaffected

6. `pnpm build && pnpm test`, then PR.

Design rationale: [original design spec](https://github.com/xpzouying/learn-skills/blob/main/docs/superpowers/specs/2026-05-03-readify-site-rules-design.md) (authored before the rename to readlite).
