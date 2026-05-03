import type { SiteRule } from './types';
import { wechatMpRule } from './wechat-mp';

/**
 * Order = priority. List more specific rules first; first match wins.
 *
 * To add a rule: see docs/site-rules.md (or the spec at
 * docs/superpowers/specs/2026-05-03-readify-site-rules-design.md).
 */
export const ALL_SITE_RULES: SiteRule[] = [
  wechatMpRule,
];

// Sanity check: every rule must define at least one hook.
for (const rule of ALL_SITE_RULES) {
  if (!rule.preProcess && !rule.defuddleOptions && !rule.postProcess) {
    throw new Error(`site-rule "${rule.name}" defines no hooks — it is a no-op`);
  }
}

export type { SiteRule, SiteMatcher } from './types';
export { matchesUrl, findRule } from './matcher';
