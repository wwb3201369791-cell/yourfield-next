import { describe, expect, it } from 'vitest';

import { adminI18nResources } from '@/lib/payload/adminI18nResources';

describe('Payload admin zh i18n resources', () => {
  it('only exposes Chinese and English as admin interface languages', () => {
    expect(Object.keys(adminI18nResources).sort()).toEqual(['en', 'zh']);
  });

  it('keeps natural Chinese labels for list controls', () => {
    expect(adminI18nResources.zh.general).toMatchObject({
      columns: '显示字段',
      filters: '筛选条件',
      perPage: '每页显示 {{limit}} 条',
    });
  });

  it('overrides stiff Payload empty-state copy with natural admin wording', () => {
    expect(adminI18nResources.zh.general).toMatchObject({
      noResults: '暂无匹配的 {{label}}。',
      noResultsDescription: '清空搜索或调整筛选条件后再试。',
      noResultsFound: '暂时没有记录',
      notFound: '未找到相关条目',
      of: '共',
    });
  });

  it('labels the Payload locale picker as content language', () => {
    expect(adminI18nResources.zh.general).toMatchObject({
      fallbackToDefaultLocale: '空内容临时显示参考语言',
      locale: '内容语言',
      locales: '内容语言',
    });
  });
});
