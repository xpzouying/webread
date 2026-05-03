import type { SiteMatcher, SiteRule } from './types';

export function matchesUrl(matcher: SiteMatcher, url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const target = matcher.domain.toLowerCase();

  let domainOk: boolean;
  if (target.startsWith('*.')) {
    const base = target.slice(2);
    domainOk = hostname === base || hostname.endsWith('.' + base);
  } else {
    domainOk = hostname === target;
  }
  if (!domainOk) return false;

  if (matcher.pathPrefix && !parsed.pathname.startsWith(matcher.pathPrefix)) {
    return false;
  }
  return true;
}

export function findRule(
  rules: SiteRule[],
  url: string | undefined
): SiteRule | undefined {
  if (!url) return undefined;
  return rules.find((r) => matchesUrl(r.match, url));
}
