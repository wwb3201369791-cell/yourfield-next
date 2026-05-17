import Link from 'next/link';

import { NewsCard } from '@/components/news/NewsCard';
import { CtaBand } from '@/components/public/CtaBand';
import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { newsItems } from '@/lib/mock/news';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type NewsPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export async function generateMetadata({ params }: NewsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/news',
    title: t('page.news.title'),
    description: t('page.news.ctaText'),
    image: '/images/headers/news-center.png',
  });
}

export default async function NewsPage({ params }: NewsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const featured = newsItems.slice(0, 3);
  const channelItems = newsItems.slice(3);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(
            t('page.news.title'),
            t('page.news.ctaText'),
            localizedPath(locale, '/news'),
          ),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.news.title'), path: localizedPath(locale, '/news') },
          ]),
        ]}
      />
      <PageHero
        title={t('page.news.title')}
        description={t('page.news.ctaText')}
        image="/images/headers/news-center.png"
        imageAlt={t('page.news.companyAlt')}
        priority
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.news.resourceTag')}
            title={t('page.news.resourceTitle')}
            text={t('page.news.resourceText')}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {featured.map((item) => (
              <NewsCard
                key={item.slug}
                item={item}
                locale={locale}
                title={t(item.titleKey)}
                excerpt={t(item.excerptKey)}
                category={t(item.categoryKey)}
                date={t(item.dateKey)}
                actionLabel={t('page.news.detailOpenLabel')}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="company-news" className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              align="left"
              eyebrow={t('page.news.channelsTag')}
              title={t('page.news.channelsTitle')}
              text={t('page.news.partnersText')}
            />
            <Link className="btn btn-secondary shrink-0" href={`/${locale}/contact`}>
              {t('page.news.ctaPrimary')}
            </Link>
          </div>
          <div className="grid gap-4">
            {channelItems.map((item) => (
              <article
                key={item.slug}
                className="grid gap-4 rounded border border-border bg-white p-5 md:grid-cols-[150px_1fr_auto] md:items-center"
              >
                <time className="text-sm font-bold text-accent">{t(item.dateKey)}</time>
                <div>
                  <h3 className="text-xl font-bold text-primary">
                    <Link href={`/${locale}/news/${item.slug}`}>{t(item.titleKey)}</Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-light">
                    {t(item.excerptKey)}
                  </p>
                </div>
                <Link
                  className="inline-flex text-sm font-bold text-primary hover:text-accent"
                  href={`/${locale}/news/${item.slug}`}
                >
                  {t('page.news.channel4Action')}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={t('page.news.ctaTitle')}
        text={t('page.news.ctaText')}
        primaryHref={`/${locale}/contact`}
        primaryLabel={t('page.news.ctaPrimary')}
      />
    </>
  );
}
