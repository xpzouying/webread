import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchesUrl } from '../../src/site-rules/matcher';
import { sinaNewsRule } from '../../src/site-rules/sina-news';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const cliPath = join(repoRoot, 'dist', 'cli.js');
const fixturesDir = join(repoRoot, 'test', 'fixtures');
const SINA_URL = 'https://k.sina.com.cn/article_1887344341_707e96d502001r7r8.html?from=news';
const NON_SINA_URL = 'https://example.com/article';

interface RunResult { exitCode: number; stdout: string; stderr: string }

function runCli(args: string[], stdinHtml: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [cliPath, ...args]);
    let stdout = ''; let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));
    proc.on('close', (code) => resolve({ exitCode: code ?? -1, stdout, stderr }));
    proc.on('error', reject);
    proc.stdin.write(stdinHtml);
    proc.stdin.end();
  });
}

beforeAll(() => {
  if (!existsSync(cliPath)) throw new Error('CLI not built; run pnpm build');
});

describe('site-rule: sina-news', () => {
  // === Assertion 1: MATCH ===
  it('matches Sina subdomains', () => {
    expect(matchesUrl(sinaNewsRule.match, SINA_URL)).toBe(true);
    expect(matchesUrl(sinaNewsRule.match, 'https://news.sina.com.cn/x')).toBe(true);
    expect(matchesUrl(sinaNewsRule.match, 'https://sina.com.cn/x')).toBe(true);
  });

  it('does not match other domains', () => {
    expect(matchesUrl(sinaNewsRule.match, NON_SINA_URL)).toBe(false);
  });

  // === Assertion 2: IMPROVEMENT ===
  it('strips known sidebar widgets from the output', async () => {
    const html = readFileSync(join(fixturesDir, 'sina-news', 'input.html'), 'utf8');
    const r = await runCli([SINA_URL], html);

    expect(r.exitCode).toBe(0);
    expect(r.stderr).toBe('');

    // Article body still present
    expect(r.stdout).toContain('外交部');

    // Sidebar widgets gone
    expect(r.stdout).not.toContain('阅读排行榜');
    expect(r.stdout).not.toContain('评论排行榜');
    expect(r.stdout).not.toContain('最热评论');
    expect(r.stdout).not.toContain('登录|');
  });

  // === Assertion 3: NON-REGRESSION ===
  it('does not affect non-Sina URLs run through the same fixture', async () => {
    const html = readFileSync(join(fixturesDir, 'sina-news', 'input.html'), 'utf8');
    const rNoRule = await runCli([NON_SINA_URL], html);
    const rWithRule = await runCli([SINA_URL], html);

    expect(rWithRule.stdout).not.toBe(rNoRule.stdout);
    expect(rNoRule.exitCode).toBe(0);
  });
});
