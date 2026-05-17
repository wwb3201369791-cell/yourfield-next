import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n/locale';
import type { NewsItem } from '@/lib/mock/news';

type NewsCardProps = Readonly<{
  item: NewsItem;
  locale: Locale;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  actionLabel: string;
}>;

export function NewsCard({
  item,
  locale,
  title,
  excerpt,
  category,
  date,
  actionLabel,
}: NewsCardProps) {
  return (
    <article className="group grid overflow-hidden rounded border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        className="relative block aspect-[16/9] bg-bg-light"
        href={`/${locale}/news/${item.slug}`}
        aria-label={`${actionLabel}: ${title}`}
      >
        <Image
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          src={item.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          <span>{category}</span>
          <span className="bg-accent/60 h-1 w-1 rounded-full" aria-hidden="true" />
          <time>{date}</time>
        </div>
        <h3 className="mt-3 text-xl font-bold leading-snug text-primary">
          <Link href={`/${locale}/news/${item.slug}`}>{title}</Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-light">{excerpt}</p>
        <Link
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent"
          href={`/${locale}/news/${item.slug}`}
        >
          {actionLabel}
          <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
        </Link>
      </div>
    </article>
  );
}
