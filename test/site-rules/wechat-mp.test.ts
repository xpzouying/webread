import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchesUrl } from '../../src/site-rules/matcher';
import { wechatMpRule } from '../../src/site-rules/wechat-mp';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const cliPath = join(repoRoot, 'dist', 'cli.js');
const fixturesDir = join(repoRoot, 'test', 'fixtures');
const WECHAT_URL = 'https://mp.weixin.qq.com/s/ZtrY372sjwSd4Yro5wUvKQ';
const NON_WECHAT_URL = 'https://example.com/article';

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
  if (!existsSync(cliPath)) {
    throw new Error(`CLI not built. Run \`pnpm build\` first.`);
  }
});

describe('site-rule: wechat-mp', () => {
  // === Assertion 1: MATCH ===
  it('matches the WeChat MP article URL', () => {
    expect(matchesUrl(wechatMpRule.match, WECHAT_URL)).toBe(true);
  });

  it('does not match the WeChat homepage / non-article paths', () => {
    expect(matchesUrl(wechatMpRule.match, 'https://mp.weixin.qq.com/profile')).toBe(false);
  });

  it('does not match other domains', () => {
    expect(matchesUrl(wechatMpRule.match, NON_WECHAT_URL)).toBe(false);
  });

  // === Assertion 2: IMPROVEMENT ===
  it('extracts at least 5 images from the WeChat fixture (vs ~1 without rule)', async () => {
    const html = readFileSync(join(fixturesDir, 'weixin-mp', 'input.html'), 'utf8');
    const r = await runCli([WECHAT_URL], html);

    expect(r.exitCode).toBe(0);
    expect(r.stderr).toBe('');

    const imgLines = r.stdout.match(/^!\[.*\]\(/gm) ?? [];
    expect(imgLines.length).toBeGreaterThanOrEqual(5);

    // No data: placeholder URIs leak through
    expect(r.stdout).not.toContain('data:image/svg+xml');
  });

  // === Assertion 3: NON-REGRESSION ===
  it('does not affect non-WeChat URLs run through the same fixture', async () => {
    const html = readFileSync(join(fixturesDir, 'weixin-mp', 'input.html'), 'utf8');

    // Run with non-WeChat URL — rule should NOT fire
    const rNoRule = await runCli([NON_WECHAT_URL], html);
    // Run with WeChat URL — rule fires
    const rWithRule = await runCli([WECHAT_URL], html);

    // The two outputs should differ (proves the rule changes things only when matched)
    expect(rWithRule.stdout).not.toBe(rNoRule.stdout);
    // The non-rule run still succeeds (universal pipeline still works)
    expect(rNoRule.exitCode).toBe(0);
  });
});
