import type { SiteRule } from './types';

/**
 * Sina news pages (*.sina.com.cn) contain several sidebar and widget regions
 * that Defuddle's universal heuristics don't strip:
 *
 * - #wrap_bottom_omment  – comment widget (评论框, 登录|注册, 最热评论, etc.)
 * - .article-content-right / #read-comment – 阅读排行榜 + 评论排行榜 sidebar
 * - #tab_related – related news links (相关新闻)
 * - .page-right-bar – floating right sidebar (新浪首页, 相关新闻 bar)
 * - .fengniao-container – inline promo cards (赛博对话, 热搜时代, etc. — links
 *   to weibo accounts and podcast pages, embedded in the article column)
 *
 * These are removed in preProcess before Defuddle sees the DOM.
 */
export const sinaNewsRule: SiteRule = {
  name: 'sina-news',
  match: { domain: '*.sina.com.cn' },

  preProcess(doc) {
    const sidebarSelectors: string[] = [
      // Comment widget: 0条评论 / 登录|注册 / 最热评论 / 最新评论 / 更多精彩评论
      '#wrap_bottom_omment',
      // Reading rank + comment rank sidebar
      '.article-content-right',
      '#read-comment',
      // Related news block
      '#tab_related',
      // Floating right nav bar
      '.page-right-bar',
      // Inline promo cards (weibo / podcast links embedded in article column)
      '.fengniao-container',
    ];
    for (const sel of sidebarSelectors) {
      doc.querySelectorAll(sel).forEach((el) => el.remove());
    }
  },
};
