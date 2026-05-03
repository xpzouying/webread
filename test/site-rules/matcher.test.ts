import { describe, it, expect } from 'vitest';
import { matchesUrl, findRule } from '../../src/site-rules/matcher';
import type { SiteRule } from '../../src/site-rules/types';

describe('matchesUrl', () => {
  describe('exact domain', () => {
    it('matches the exact hostname', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com' }, 'https://mp.weixin.qq.com/s/abc')).toBe(true);
    });

    it('does not match a different hostname', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com' }, 'https://mp.weixin.qq.cn/s/abc')).toBe(false);
    });

    it('does not match a subdomain when no wildcard given', () => {
      expect(matchesUrl({ domain: 'weixin.qq.com' }, 'https://mp.weixin.qq.com/s/abc')).toBe(false);
    });

    it('is case-insensitive on hostname', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com' }, 'https://MP.WEIXIN.QQ.COM/s/abc')).toBe(true);
    });
  });

  describe('subdomain wildcard', () => {
    it('matches the bare base domain', () => {
      expect(matchesUrl({ domain: '*.sina.com.cn' }, 'https://sina.com.cn/x')).toBe(true);
    });

    it('matches a subdomain', () => {
      expect(matchesUrl({ domain: '*.sina.com.cn' }, 'https://k.sina.com.cn/article')).toBe(true);
    });

    it('matches a deeply-nested subdomain', () => {
      expect(matchesUrl({ domain: '*.sina.com.cn' }, 'https://a.b.sina.com.cn/x')).toBe(true);
    });

    it('does not match a lookalike domain (no false suffix match)', () => {
      expect(matchesUrl({ domain: '*.foo.com' }, 'https://notfoo.com/x')).toBe(false);
      expect(matchesUrl({ domain: '*.foo.com' }, 'https://barfoo.com/x')).toBe(false);
    });
  });

  describe('pathPrefix', () => {
    it('matches when URL path starts with the prefix', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com', pathPrefix: '/s/' }, 'https://mp.weixin.qq.com/s/abc')).toBe(true);
    });

    it('does not match when URL path does not start with the prefix', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com', pathPrefix: '/s/' }, 'https://mp.weixin.qq.com/profile/x')).toBe(false);
    });

    it('treats absent pathPrefix as match-any-path', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com' }, 'https://mp.weixin.qq.com/anything')).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('returns false for an unparseable URL', () => {
      expect(matchesUrl({ domain: 'mp.weixin.qq.com' }, 'not a url')).toBe(false);
    });
  });
});

describe('findRule', () => {
  const ruleA: SiteRule = {
    name: 'a',
    match: { domain: 'a.com' },
    preProcess: () => {},
  };
  const ruleB: SiteRule = {
    name: 'b',
    match: { domain: '*.b.com' },
    preProcess: () => {},
  };

  it('returns the first matching rule', () => {
    expect(findRule([ruleA, ruleB], 'https://x.b.com/p')?.name).toBe('b');
  });

  it('returns undefined when no rule matches', () => {
    expect(findRule([ruleA, ruleB], 'https://other.com/x')).toBeUndefined();
  });

  it('returns undefined when url is undefined', () => {
    expect(findRule([ruleA, ruleB], undefined)).toBeUndefined();
  });
});
