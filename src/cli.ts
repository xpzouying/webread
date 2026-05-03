import { Defuddle } from 'defuddle/node';
import { JSDOM, VirtualConsole } from 'jsdom';
import TurndownService from 'turndown';
import { ALL_SITE_RULES, findRule } from './site-rules/index.js';

interface Args {
  url?: string;
  noImages: boolean;
  inlineLinks: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { url: undefined, noImages: false, inlineLinks: false };
  for (const a of argv) {
    if (a === '--no-images') out.noImages = true;
    else if (a === '--inline-links') out.inlineLinks = true;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else if (!a.startsWith('--')) {
      out.url = a;
    }
  }
  return out;
}

function printHelp(): void {
  process.stdout.write(`readlite — HTML→Markdown for AI consumption

Usage:
  cat page.html | readlite [URL] [flags]

Arguments:
  URL              Source URL (optional). Used by Defuddle for relative
                   link resolution and metadata.

Flags:
  --no-images      Strip image lines from output (token savings).
  --inline-links   Use inline link style instead of reference (default).
  -h, --help       Show this help.

Exit codes:
  0   Success
  1   Form failure (Defuddle threw, returned null/empty/whitespace).
`);
}

async function readStdin(): Promise<string> {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

// Many CMSes (WeChat MP, Medium, Substack, jQuery lazyload, etc.) ship images
// with `src` set to a placeholder (transparent SVG / 1x1 GIF) and the real URL
// stashed in `data-src` (or similar). Without this fix, those images render as
// useless data: URIs in the markdown.
const LAZY_SRC_ATTRS = [
  'data-src',
  'data-original',
  'data-lazy-src',
  'data-lazy',
  'data-actualsrc',
  'data-defer-src',
];

function unwrapLazyImages(document: Document): void {
  for (const img of Array.from(document.querySelectorAll('img'))) {
    let unwrapped = false;
    for (const attr of LAZY_SRC_ATTRS) {
      const real = img.getAttribute(attr);
      if (real && real.trim()) {
        img.setAttribute('src', real);
        img.removeAttribute(attr);
        unwrapped = true;
        break;
      }
    }
    if (unwrapped) {
      // Some lazy-load CSS classes (e.g. WeChat's wx_img_placeholder,
      // js_img_placeholder) trigger downstream extractors' clutter rules
      // even after we've swapped in the real src. Strip those hints.
      const cls = img.getAttribute('class');
      if (cls) {
        const cleaned = cls
          .split(/\s+/)
          .filter((c) => !/placeholder|lazy|loading/i.test(c))
          .join(' ');
        if (cleaned !== cls) img.setAttribute('class', cleaned);
      }
    }
  }
}

async function main(): Promise<void> {
  const { url, noImages, inlineLinks } = parseArgs(process.argv.slice(2));
  const html = await readStdin();

  if (!html.trim()) {
    process.stderr.write('readlite: empty input on stdin\n');
    process.exit(1);
  }

  const rule = findRule(ALL_SITE_RULES, url);

  let extractedHtml: string | undefined;
  try {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', () => {});
    const dom = new JSDOM(html, { virtualConsole, ...(url ? { url } : {}) });
    unwrapLazyImages(dom.window.document);
    if (rule?.preProcess) rule.preProcess(dom.window.document, url!);

    const result = await Defuddle(dom, url, {
      markdown: false,
      removeImages: noImages,
      ...rule?.defuddleOptions,
    });
    extractedHtml = result?.content;
  } catch (e: any) {
    process.stderr.write(`readlite: extraction failed: ${e?.message ?? e}\n`);
    process.exit(1);
  }

  if (!extractedHtml || !extractedHtml.trim()) {
    process.stderr.write('readlite: extraction returned empty content\n');
    process.exit(1);
  }

  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    linkStyle: inlineLinks ? 'inlined' : 'referenced',
    bulletListMarker: '-',
  });

  let md = turndown.turndown(extractedHtml);

  if (!md.trim()) {
    process.stderr.write('readlite: markdown conversion returned empty\n');
    process.exit(1);
  }

  if (rule?.postProcess) md = rule.postProcess(md, url!);

  process.stdout.write(md);
}

main().catch((e: any) => {
  process.stderr.write(`readlite: unexpected error: ${e?.message ?? e}\n`);
  process.exit(1);
});
