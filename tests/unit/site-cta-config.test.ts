import { describe, expect, it } from 'vitest';

import { buildSiteCta } from '@/lib/content/siteCta';

describe('buildSiteCta', () => {
  it('keeps global CTA copy and localized targets in one config', () => {
    const copy = {
      'site.cta.primary': '联系我们',
      'site.cta.secondary': '查看详情',
      'site.cta.text': '联系永霏防护专家，获取贴合行业场景的定制化防护方案。',
      'site.cta.title': '准备升级员工防护能力？',
    };

    expect(buildSiteCta('zh', (key) => copy[key])).toEqual({
      primaryHref: '/zh/contact',
      primaryLabel: '联系我们',
      secondaryHref: '/zh/products',
      secondaryLabel: '查看详情',
      text: '联系永霏防护专家，获取贴合行业场景的定制化防护方案。',
      title: '准备升级员工防护能力？',
    });
  });
});
