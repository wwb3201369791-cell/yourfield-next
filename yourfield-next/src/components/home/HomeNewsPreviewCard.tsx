import Link from 'next/link';

import { ArrowRightIcon } from '@/components/ui/icons';
import type { NewsItem } from '@/lib/cms/news';
import type { Locale } from '@/lib/i18n/locale';
import { isSampleNewsItem, sampleNewsLabel } from '@/lib/news/display';

type HomeNewsPreviewCardProps = Readonly<{
  actionLabel: string;
  item: NewsItem;
  locale: Locale;
}>;

export function HomeNewsPreviewCard({ actionLabel, item, locale }: HomeNewsPreviewCardProps) {
  const href = `/${locale}/news/${item.slug}`;
  const isSample = isSampleNewsItem(item);

  return (
    <article className="h-full">
      <Link
        aria-label={`${actionLabel}: ${item.title}`}
        className="hover:border-accent/35 group relative flex h-full min-h-[220px] flex-col rounded border border-border bg-bg-light p-6 text-left no-underline transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        href={href}
      >
        <div className="flex flex-wrap items-center gap-2 pr-12 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          <time dateTime={item.datePublished}>{item.datePublished.slice(0, 10)}</time>
          {isSample ? (
            <span className="border-accent/25 rounded-full border bg-white px-2 py-0.5 text-[0.68rem] leading-none text-accent">
              {sampleNewsLabel(locale)}
            </span>
          ) : null}
        </div>
        <span
          aria-hidden="true"
          className="absolute right-6 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-primary opacity-70 transition duration-300 group-hover:translate-x-1 group-hover:border-accent group-hover:bg-accent group-hover:text-white group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:border-accent group-focus-visible:bg-accent group-focus-visible:text-white group-focus-visible:opacity-100"
        >
          <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
        </span>
        <h3 className="mt-3 pr-8 text-xl font-bold leading-snug text-primary transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent">
          {item.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-light">{item.excerpt}</p>
      </Link>
    </article>
  );
}
