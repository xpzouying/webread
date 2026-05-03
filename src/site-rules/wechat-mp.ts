import type { SiteRule } from './types';

/**
 * WeChat MP articles wrap their body in `#js_content` and bury images deep in
 * nested `<section>` elements (often with `wx_img_placeholder` classes). Two
 * problems for Defuddle:
 *
 * 1. The deeply-nested `<section>` ancestors confuse Defuddle's content scoring,
 *    causing it to discard image-bearing branches as low-density chrome.
 * 2. Even after lazy-src promotion (universal), `<img>` elements without a
 *    parent that Defuddle treats as content-bearing get pruned.
 *
 * Approach:
 *   - Lift `#js_content` to be the only body child (kills WeChat chrome).
 *   - Flatten any `<section>` ancestors of `<img>` into `<p>` so the image is
 *     no longer in a low-scoring section subtree.
 *   - Wrap each image in a `<figure>`. Defuddle's `imageRules` give figures
 *     special treatment as content-bearing nodes, so the image survives.
 */
export const wechatMpRule: SiteRule = {
  name: 'wechat-mp',
  match: { domain: 'mp.weixin.qq.com', pathPrefix: '/s/' },

  preProcess(doc) {
    const article = doc.querySelector('#js_content');
    if (!article) return;

    doc.body.replaceChildren(article);

    for (const img of Array.from(article.querySelectorAll('img'))) {
      // Flatten ancestor SECTIONs into Ps so img isn't in a section subtree.
      let parent = img.parentElement;
      while (parent && parent !== article && parent.tagName === 'SECTION') {
        const p = doc.createElement('p');
        p.replaceChildren(...Array.from(parent.childNodes));
        parent.replaceWith(p);
        parent = p.parentElement;
      }
      // Wrap each image in a <figure> so Defuddle's imageRules keep it.
      const figure = doc.createElement('figure');
      img.replaceWith(figure);
      figure.appendChild(img);
    }
  },

  defuddleOptions: {
    contentSelector: '#js_content, body',
  },
};
