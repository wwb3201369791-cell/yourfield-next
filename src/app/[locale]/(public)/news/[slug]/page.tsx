import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/public/JsonLd';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import { getCmsNewsBySlug, getCmsNewsStaticParams, type NewsContentBlock } from '@/lib/cms/news';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { isSampleNewsItem, sampleNewsLabel } from '@/lib/news/display';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, newsArticleJsonLd } from '@/lib/seo/jsonld';

type NewsDetailPageProps = Readonly<{
  params: {
    locale: string;
    slug: string;
  };
}>;

function NewsArticleBlock({ block, index }: { block: NewsContentBlock; index: number }) {
  if (block.type === 'heading') {
    const className =
      block.level === 4
        ? 'mt-8 text-2xl font-bold text-primary'
        : 'mt-10 text-3xl font-bold text-primary';

    if (block.level === 4) {
      return <h4 className={className}>{block.text}</h4>;
    }

    if (block.level === 3) {
      return <h3 className={className}>{block.text}</h3>;
    }

    return <h2 className={className}>{block.text}</h2>;
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-accent bg-bg-light px-6 py-4 text-xl font-semibold leading-9 text-primary">
        {block.text}
      </blockquote>
    );
  }

  if (block.type === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';

    return (
      <ListTag className={block.ordered ? 'list-decimal pl-6' : 'list-disc pl-6'}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === 'image') {
    return (
      <figure className="not-prose my-10" key={`${block.src}-${index}`}>
        <div className="overflow-hidden rounded-lg border border-border bg-bg-light shadow-sm">
          <Image
            className="h-auto w-full object-cover"
            src={block.src}
            alt={block.alt}
            width={block.width ?? 1200}
            height={block.height ?? 760}
            sizes="(min-width: 1024px) 900px, 100vw"
            unoptimized={shouldUseUnoptimizedImage(block.src)}
          />
        </div>
        {block.caption ? (
          <figcaption className="mt-3 text-center text-sm leading-6 text-text-light">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return <p>{block.text}</p>;
}

export async function generateStaticParams() {
  return getCmsNewsStaticParams();
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const item = await getCmsNewsBySlug(locale, params.slug, isDraft);

  if (!item) {
    return {};
  }

  return buildPageMetadata({
    locale,
    path: `/news/${item.slug}`,
    title: item.title,
    description: item.excerpt,
    image: item.image,
    noIndex: isDraft,
    type: 'article',
  });
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);
  const item = await getCmsNewsBySlug(locale, params.slug, isDraft);

  if (!item) {
    notFound();
  }

  const siteSettings = await getCmsSiteSettings(locale);
  const isCmsMediaImage = shouldUseUnoptimizedImage(item.image);
  const isSample = isSampleNewsItem(item);

  return (
    <>
      <JsonLd
        data={[
          newsArticleJsonLd(item, locale, item.title, item.excerpt, siteSettings),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.news.title'), path: localizedPath(locale, '/news') },
            { name: item.title, path: localizedPath(locale, `/news/${item.slug}`) },
          ]),
        ]}
      />
      <article className="bg-white">
        <header className="bg-bg-light py-16 md:py-24">
          <div className="container max-w-4xl">
            <Link
              className="text-sm font-bold text-accent hover:text-primary"
              href={`/${locale}/news`}
            >
              {t('page.news.detailBack')}
            </Link>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold uppercase tracking-[0.12em] text-accent">
              <span>{item.category}</span>
              <time>{item.datePublished.slice(0, 10)}</time>
              {isSample ? (
                <span className="border-accent/25 rounded-full border bg-white px-2 py-1 text-xs leading-none text-accent">
                  {sampleNewsLabel(locale)}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-primary md:text-5xl">
              {item.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-light">{item.excerpt}</p>
          </div>
        </header>

        <div className="container max-w-4xl py-12 md:py-16">
          <div className="relative aspect-[16/9] overflow-hidden rounded bg-bg-light shadow-lg">
            <Image
              className="h-full w-full object-cover"
              src={item.image}
              alt={t('page.news.detailAlt')}
              fill
              priority
              sizes="(min-width: 1024px) 900px, 100vw"
              unoptimized={isCmsMediaImage}
            />
          </div>
          <div className="prose prose-lg mt-10 max-w-none">
            {item.content.map((block, index) => (
              <NewsArticleBlock block={block} index={index} key={`${block.type}-${index}`} />
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
