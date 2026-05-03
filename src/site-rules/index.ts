import type { SiteRule } from './types';
import { wechatMpRule } from './wechat-mp';
import { sinaNewsRule } from './sina-news';

/**
 * Order = priority. List more specific rules first; first match wins.
 *
 * To add a rule: see docs/site-rules.md.
 */
export const ALL_SITE_RULES: SiteRule[] = [
  wechatMpRule,
  sinaNewsRule,
];

// Sanity check: every rule must define at least one hook.
for (const rule of ALL_SITE_RULES) {
  if (!rule.preProcess && !rule.defuddleOptions && !rule.postProcess) {
    throw new Error(`site-rule "${rule.name}" defines no hooks — it is a no-op`);
  }
}

export type { SiteRule, SiteMatcher } from './types';
export { matchesUrl, findRule } from './matcher';
