import type { Locale } from '@/lib/i18n/locale';

type NewsDisplayItem = Readonly<{
  excerpt: string;
  title: string;
}>;

const sampleTitlePrefixes = ['示例：', 'Example:', 'Пример:'] as const;
const sampleCopyMarkers = [
  '前台版式示例',
  '正式内容确认后替换',
  'layout sample',
  'final copy is confirmed',
  'пример макета',
] as const;

export function isSampleNewsItem(item: NewsDisplayItem) {
  const title = item.title.trim();
  const excerpt = item.excerpt.toLowerCase();

  return (
    sampleTitlePrefixes.some((prefix) => title.startsWith(prefix)) ||
    sampleCopyMarkers.some((marker) => excerpt.includes(marker.toLowerCase()))
  );
}

export function sampleNewsLabel(locale: Locale) {
  if (locale === 'en') {
    return 'Sample';
  }

  if (locale === 'ru') {
    return 'Пример';
  }

  return '示例';
}
