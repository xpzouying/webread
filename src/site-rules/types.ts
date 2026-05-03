import type { DefuddleOptions } from 'defuddle';

export interface SiteMatcher {
  /**
   * Domain to match. Use a leading "*." for subdomain wildcard.
   *   "mp.weixin.qq.com"  — exact match only
   *   "*.sina.com.cn"     — matches sina.com.cn, k.sina.com.cn, news.sina.com.cn, etc.
   */
  domain: string;

  /**
   * Optional path prefix. URL pathname must start with this string for the
   * rule to match. Example: "/s/" matches "/s/abc123" but not "/profile/x".
   */
  pathPrefix?: string;
}

export interface SiteRule {
  /** Stable identifier — used for logging, test naming, debugging. e.g. "wechat-mp". */
  name: string;

  /** URL matching condition. */
  match: SiteMatcher;

  /**
   * Mutate the JSDOM Document before Defuddle sees it. Use this to:
   *   - remove site-specific clutter elements
   *   - flatten / reshape DOM that confuses Defuddle's heuristics
   *   - extract a known content container into the body root
   * The function returns void; mutate `doc` in place.
   */
  preProcess?: (doc: Document, url: string) => void;

  /**
   * Override Defuddle options for this site. Merged on top of defaults via
   * shallow spread. Useful for `contentSelector`, `removeImages`, etc.
   */
  defuddleOptions?: Partial<DefuddleOptions>;

  /**
   * Post-process the markdown after Turndown conversion. Use for cleanup
   * that is easier in markdown than in DOM.
   */
  postProcess?: (markdown: string, url: string) => string;
}
