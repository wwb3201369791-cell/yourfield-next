import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/public/JsonLd';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { locales } from '@/lib/i18n/locale';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { getNewsBySlug, newsBodyFallback, newsItems } from '@/lib/mock/news';
import { localized } from '@/lib/mock/products';
import { breadcrumbJsonLd, newsArticleJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata, localizedPath } from '@/lib/seo/metadata';

type NewsDetailPageProps = Readonly<{
  params: {
    locale: string;
    slug: string;
  };
}>;

export function generateStaticParams() {
  return locales.flatMap((locale) => newsItems.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const item = getNewsBySlug(params.slug);

  if (!item) {
    return {};
  }

  return buildPageMetadata({
    locale,
    path: `/news/${item.slug}`,
    title: t(item.titleKey),
    description: t(item.excerptKey),
    image: item.image,
    type: 'article',
  });
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const item = getNewsBySlug(params.slug);

  if (!item) {
    notFound();
  }

  const title = t(item.titleKey);
  const description = t(item.excerptKey);

  return (
    <>
      <JsonLd
        data={[
          newsArticleJsonLd(item, locale, title, description),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.news.title'), path: localizedPath(locale, '/news') },
            { name: title, path: localizedPath(locale, `/news/${item.slug}`) },
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
              <span>{t(item.categoryKey)}</span>
              <time>{t(item.dateKey)}</time>
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-primary md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-light">{description}</p>
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
            />
          </div>
          <div className="prose prose-lg mt-10 max-w-none">
            <p>{localized(newsBodyFallback, locale)}</p>
            <p>{description}</p>
          </div>
        </div>
      </article>
    </>
  );
}
