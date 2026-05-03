import type { SiteRule } from './types';

/**
 * Order = priority. List more specific rules first; first match wins.
 *
 * To add a rule: see docs/site-rules.md (or the spec at
 * docs/superpowers/specs/2026-05-03-readify-site-rules-design.md).
 */
export const ALL_SITE_RULES: SiteRule[] = [
  // Rules will be added in Task 4 (wechat-mp) and Task 5 (sina-news).
];

// Sanity check: every rule must define at least one hook.
for (const rule of ALL_SITE_RULES) {
  if (!rule.preProcess && !rule.defuddleOptions && !rule.postProcess) {
    throw new Error(`site-rule "${rule.name}" defines no hooks — it is a no-op`);
  }
}

export type { SiteRule, SiteMatcher } from './types';
export { matchesUrl, findRule } from './matcher';
