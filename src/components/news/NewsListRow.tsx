import Link from 'next/link';

import { ArrowRightIcon } from '@/components/ui/icons';
import type { NewsItem } from '@/lib/cms/news';
import type { Locale } from '@/lib/i18n/locale';

type NewsListRowProps = Readonly<{
  actionLabel: string;
  item: NewsItem;
  locale: Locale;
}>;

export function NewsListRow({ actionLabel, item, locale }: NewsListRowProps) {
  return (
    <Link
      className="news-list-row"
      href={`/${locale}/news/${item.slug}`}
      aria-label={`${actionLabel}: ${item.title}`}
    >
      <time className="news-list-row__date">{item.datePublished.slice(0, 10)}</time>
      <span className="news-list-row__body">
        <span className="news-list-row__title-line">
          <strong>{item.title}</strong>
        </span>
        <span className="news-list-row__excerpt">{item.excerpt}</span>
      </span>
      <span className="news-list-row__action">
        {actionLabel}
        <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
      </span>
    </Link>
  );
}
