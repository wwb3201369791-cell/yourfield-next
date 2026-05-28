import { describe, expect, it } from 'vitest';

import { adminI18nResources } from '@/lib/payload/adminI18nResources';

describe('Payload admin zh i18n resources', () => {
  it('keeps natural Chinese labels for list controls', () => {
    expect(adminI18nResources.zh.general).toMatchObject({
      columns: '显示字段',
      filters: '筛选条件',
      perPage: '每页显示 {{limit}} 条',
    });
  });

  it('overrides terse pagination and empty-state copy through i18n.resources', () => {
    expect(adminI18nResources.zh.general).toMatchObject({
      noResults: '暂无符合条件的{{label}}记录。',
      notFound: '未找到相关条目',
      of: '共',
    });
  });

  it('labels the Payload locale picker as content language', () => {
    expect(adminI18nResources.zh.general).toMatchObject({
      fallbackToDefaultLocale: '使用默认内容语言回填',
      locale: '内容语言',
      locales: '内容语言',
    });
  });
});
