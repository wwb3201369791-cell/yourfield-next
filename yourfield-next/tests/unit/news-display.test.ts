import { describe, expect, it } from 'vitest';

import { isSampleNewsItem, sampleNewsLabel } from '@/lib/news/display';

describe('news display helpers', () => {
  it('detects explicit sample placeholder copy', () => {
    expect(
      isSampleNewsItem({
        title: '示例：行业目录新闻标题待补充',
        excerpt: '此条为前台版式示例，用于展示新闻卡片、列表和详情页结构。',
      }),
    ).toBe(true);
  });

  it('does not mark regular news as sample content', () => {
    expect(
      isSampleNewsItem({
        title: '党建铸安 赋能产业',
        excerpt: '永霏集团围绕党建引领、安全生产和产业协同开展主题活动。',
      }),
    ).toBe(false);
  });

  it('returns localized sample labels', () => {
    expect(sampleNewsLabel('zh')).toBe('示例');
    expect(sampleNewsLabel('en')).toBe('Sample');
    expect(sampleNewsLabel('ru')).toBe('Пример');
  });
});
