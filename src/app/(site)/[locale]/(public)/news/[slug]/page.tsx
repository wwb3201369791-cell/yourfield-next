import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/public/JsonLd';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import { getCmsNewsBySlug, getCmsNewsStaticParams, type NewsContentBlock } from '@/lib/cms/news';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocaleAndSlug, type LocaleSlugRouteParams } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, newsArticleJsonLd } from '@/lib/seo/jsonld';

type NewsDetailPageProps = Readonly<{
  params: LocaleSlugRouteParams;
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
  const { locale, slug } = await resolveRouteLocaleAndSlug(params);
  const isDraft = await isDraftModeEnabled();
  const item = await getCmsNewsBySlug(locale, slug, isDraft);

  if (!item) {
    return {};
  }

  const seo = item.seo;

  return buildPageMetadata({
    locale,
    path: `/news/${item.slug}`,
    title: seo?.title || item.title,
    description: seo?.description || item.excerpt,
    image: seo?.image || item.image,
    canonical: seo?.canonical,
    keywords: seo?.keywords,
    noIndex: isDraft || Boolean(seo?.noIndex),
    type: 'article',
  });
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { locale, slug } = await resolveRouteLocaleAndSlug(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const item = await getCmsNewsBySlug(locale, slug, isDraft);

  if (!item) {
    notFound();
  }

  const siteSettings = await getCmsSiteSettings(locale);
  const isCmsMediaImage = shouldUseUnoptimizedImage(item.image);
  const hasHeroMedia = Boolean(item.video || item.image);

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
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-primary md:text-5xl">
              {item.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-light">{item.excerpt}</p>
          </div>
        </header>

        <div className="container max-w-4xl py-12 md:py-16">
          {hasHeroMedia ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded bg-bg-light shadow-lg">
              {item.video ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption -- CMS video news uses the article body for surrounding context.
                <video
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={item.title}
                >
                  <source src={item.video.src} type="video/mp4" />
                </video>
              ) : item.image ? (
                <Image
                  className="h-full w-full object-cover"
                  src={item.image}
                  alt={t('page.news.detailAlt')}
                  fill
                  priority
                  sizes="(min-width: 1024px) 900px, 100vw"
                  unoptimized={isCmsMediaImage}
                />
              ) : null}
            </div>
          ) : null}
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
