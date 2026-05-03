# Site-rules

readify ships a small registry of per-site clean-up rules that fire when the
caller passes a matching URL. Universal pages (anything without a registered
rule) go through the standard pipeline unchanged.

Active rules live under `src/site-rules/`. Each rule is a TypeScript module
that exports a `SiteRule` and is registered in `src/site-rules/index.ts`.

## Adding a new rule

If you observe a page that produces poor markdown:

1. **Capture the page HTML** — pipe the rendered DOM (e.g. via kimi-webbridge's
   `evaluate` tool with `document.documentElement.outerHTML`) into
   `test/fixtures/<rule-name>/input.html`. Save the URL to `url.txt` next to it.

2. **Reproduce the failure** with the current pipeline:
   ```bash
   cat test/fixtures/<rule-name>/input.html | node dist/cli.js "<URL>"
   ```
   Note exactly what's wrong: missing content, sidebar leak, broken images, etc.

3. **Pick the right hook**:
   - DOM-level transform → `preProcess(doc, url)`
   - Tell Defuddle where the article is → `defuddleOptions: { contentSelector: '...' }`
   - Cleanup easier in markdown than DOM → `postProcess(md, url)`

4. **Write the rule** at `src/site-rules/<rule-name>.ts`. Use existing rules
   (`wechat-mp.ts`, `sina-news.ts`) as templates.

5. **Register** the rule in `src/site-rules/index.ts`. Place more specific rules
   earlier in the array (first-match-wins).

6. **Write the integration test** at `test/site-rules/<rule-name>.test.ts`.
   It MUST contain the three required assertions:
   - **Match** — the rule's matcher accepts the right URL, rejects others
   - **Improvement** — a measurable signal improves under the rule
   - **Non-regression** — same fixture HTML with a non-matching URL is unaffected

7. **Verify**: `pnpm build && pnpm test` (everything green) plus a manual
   end-to-end run on the live URL.

8. **Open a PR** with the rule, the test, and the fixture.

For the design rationale and full architecture, see
[`docs/superpowers/specs/2026-05-03-readify-site-rules-design.md`](../../docs/superpowers/specs/2026-05-03-readify-site-rules-design.md).
