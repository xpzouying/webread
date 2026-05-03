import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(repoRoot, 'dist', 'cli.js');
const fixturesDir = join(repoRoot, 'test', 'fixtures');

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], stdinHtml: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [cliPath, ...args]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));
    proc.on('close', (code) =>
      resolve({ exitCode: code ?? -1, stdout, stderr })
    );
    proc.on('error', reject);
    proc.stdin.write(stdinHtml);
    proc.stdin.end();
  });
}

function loadFixture(name: string): { html: string; url?: string } {
  const html = readFileSync(join(fixturesDir, name, 'input.html'), 'utf8');
  const urlPath = join(fixturesDir, name, 'url.txt');
  const url = existsSync(urlPath)
    ? readFileSync(urlPath, 'utf8').trim()
    : undefined;
  return { html, url };
}

beforeAll(() => {
  if (!existsSync(cliPath)) {
    throw new Error(
      `CLI not built at ${cliPath}. Run \`pnpm build\` before tests.`
    );
  }
});

describe('readify', () => {
  describe('claude-docs (English tech doc with code blocks)', () => {
    it('extracts clean markdown with reference-style links', async () => {
      const { html, url } = loadFixture('claude-docs');
      const r = await runCli([url!], html);

      expect(r.exitCode).toBe(0);
      expect(r.stderr).toBe('');
      expect(r.stdout).toContain('Prompt caching');
      // reference-style link defs at end
      expect(r.stdout).toMatch(/\n\[\d+\]: https?:\/\//);
      // code block preserved
      expect(r.stdout).toContain('client = anthropic.Anthropic()');
      // no nav/footer leakage
      expect(r.stdout.toLowerCase()).not.toContain('cookie policy');
      expect(r.stdout.toLowerCase()).not.toContain('sign up');
    });

    it('--inline-links produces no reference defs', async () => {
      const { html, url } = loadFixture('claude-docs');
      const r = await runCli([url!, '--inline-links'], html);

      expect(r.exitCode).toBe(0);
      // no reference-style defs
      expect(r.stdout).not.toMatch(/\n\[\d+\]: https?:\/\//);
      // links are inline like [text](url)
      expect(r.stdout).toMatch(/\[[^\]]+\]\(https?:\/\//);
    });

    it('--no-images strips image lines', async () => {
      const { html, url } = loadFixture('claude-docs');
      const withImg = await runCli([url!], html);
      const noImg = await runCli([url!, '--no-images'], html);

      expect(noImg.exitCode).toBe(0);
      // image markdown lines should be gone
      const imgRe = /!\[[^\]]*\]\(/g;
      const before = (withImg.stdout.match(imgRe) ?? []).length;
      const after = (noImg.stdout.match(imgRe) ?? []).length;
      expect(after).toBeLessThan(before);
      expect(after).toBe(0);
    });
  });

  describe('weixin-mp (Chinese article via WeChat)', () => {
    it('extracts article body, drops WeChat chrome', async () => {
      const { html, url } = loadFixture('weixin-mp');
      const r = await runCli([url!], html);

      expect(r.exitCode).toBe(0);
      expect(r.stderr).toBe('');
      // body should contain CJK
      expect(r.stdout).toMatch(/[一-鿿]/);
      // size sanity: WeChat HTML is ~4MB, extracted markdown should be ≤200KB
      expect(r.stdout.length).toBeLessThan(200_000);
      // no obvious WeChat chrome leakage
      expect(r.stdout).not.toContain('var window.wx');
    });
  });

  describe('empty-page (form failure)', () => {
    it('exits 1 with stderr message on empty body', async () => {
      const { html } = loadFixture('empty-page');
      const r = await runCli([], html);

      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/empty/i);
      expect(r.stdout).toBe('');
    });

    it('exits 1 on empty stdin', async () => {
      const r = await runCli([], '');
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/empty input/i);
    });
  });
});
