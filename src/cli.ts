import { Defuddle } from 'defuddle/node';
import { JSDOM, VirtualConsole } from 'jsdom';
import TurndownService from 'turndown';

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
  process.stdout.write(`readify — HTML→Markdown for AI consumption

Usage:
  cat page.html | readify [URL] [flags]

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

async function main(): Promise<void> {
  const { url, noImages, inlineLinks } = parseArgs(process.argv.slice(2));
  const html = await readStdin();

  if (!html.trim()) {
    process.stderr.write('readify: empty input on stdin\n');
    process.exit(1);
  }

  let extractedHtml: string | undefined;
  try {
    // We don't render styles, run scripts, or load resources, so jsdom's
    // diagnostic events are all noise for our use case. Silence them; if
    // extraction truly fails it surfaces as empty content, which we handle.
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', () => {});
    const dom = new JSDOM(html, { virtualConsole, ...(url ? { url } : {}) });
    const result = await Defuddle(dom, url, {
      markdown: false,
      removeImages: noImages,
    });
    extractedHtml = result?.content;
  } catch (e: any) {
    process.stderr.write(`readify: extraction failed: ${e?.message ?? e}\n`);
    process.exit(1);
  }

  if (!extractedHtml || !extractedHtml.trim()) {
    process.stderr.write('readify: extraction returned empty content\n');
    process.exit(1);
  }

  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    linkStyle: inlineLinks ? 'inlined' : 'referenced',
    bulletListMarker: '-',
  });

  const md = turndown.turndown(extractedHtml);

  if (!md.trim()) {
    process.stderr.write('readify: markdown conversion returned empty\n');
    process.exit(1);
  }

  process.stdout.write(md);
}

main().catch((e: any) => {
  process.stderr.write(`readify: unexpected error: ${e?.message ?? e}\n`);
  process.exit(1);
});
