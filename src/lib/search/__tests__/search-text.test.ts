import { describe, expect, it } from 'vitest';

import {
  asStringArray,
  collectPublicText,
  normalizeKey,
  normalizeSearchText,
  richTextToPlainText,
  tokenizeQuery,
  truncate,
} from '../search-text';

describe('search text helpers', () => {
  it('normalizes full-width characters, casing, and whitespace', () => {
    expect(normalizeSearchText('  ＨＹＦ　５５０６  防护服  ')).toBe('hyf 5506 防护服');
    expect(normalizeKey('Forest Fire')).toBe('forest-fire');
  });

  it('tokenizes mixed Chinese, Latin, and numeric queries while keeping the full query token', () => {
    expect(tokenizeQuery('消防 HYF-5506')).toEqual(['消防 hyf-5506', '消防', 'hyf', '5506']);
  });

  it('extracts plain text from nested rich text nodes', () => {
    const richText = {
      root: {
        children: [{ children: [{ text: '阻燃' }, { text: '隔热' }] }, { text: '消防服' }],
      },
    };

    expect(richTextToPlainText(richText)).toBe('阻燃 隔热 消防服');
  });

  it('collects public copy while skipping media and link-only fields', () => {
    const text = collectPublicText({
      title: '公开标题',
      href: '/should-not-be-indexed',
      image: '/media/product.jpg',
      blocks: [
        {
          heading: '应用场景',
          ctaHref: '/contact',
          root: { children: [{ text: '森林消防' }] },
        },
      ],
    });

    expect(text).toContain('公开标题');
    expect(text).toContain('应用场景');
    expect(text).toContain('森林消防');
    expect(text).not.toContain('/should-not-be-indexed');
    expect(text).not.toContain('/media/product.jpg');
    expect(text).not.toContain('/contact');
  });

  it('normalizes string arrays from primitive and object values', () => {
    expect(asStringArray(['A', { label: 'B' }, { text: 'C' }, { value: 'D' }, 1])).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
  });

  it('truncates long snippets with an ellipsis', () => {
    const snippet = truncate('a'.repeat(200), 20);

    expect(snippet).toHaveLength(20);
    expect(snippet.endsWith('…')).toBe(true);
  });
});
