import { NewsCard } from '@/components/news/NewsCard';
import { NewsListRow } from '@/components/news/NewsListRow';
import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getCmsNews, getFeaturedNewsItems, getNewsListItemsAfterFeatured } from '@/lib/cms/news';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type NewsPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export async function generateMetadata({ params }: NewsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/news',
    title: t('page.news.title'),
    description: t('page.news.ctaText'),
    image: '/images/headers/news-center.png',
    noIndex: isDraft,
  });
}

export default async function NewsPage({ params }: NewsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);
  const newsItems = await getCmsNews(locale, isDraft);
  const featured = getFeaturedNewsItems(newsItems);
  const channelItems = getNewsListItemsAfterFeatured(newsItems);

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
                actionLabel={t('page.news.detailOpenLabel')}
              />
            ))}
            {featured.length === 0 ? (
              <p className="rounded border border-border bg-bg-light p-6 text-sm leading-6 text-text-light lg:col-span-3">
                {t('page.news.pendingLabel')}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section id="company-news" className="bg-bg-light py-14 md:py-20">
        <div className="container">
          <div className="news-company-header">
            <SectionIntro
              align="left"
              eyebrow={t('page.news.channelsTag')}
              title={t('page.news.channelsTitle')}
              text={t('page.news.partnersText')}
            />
          </div>
          <div className="grid gap-4">
            {channelItems.map((item) => (
              <NewsListRow
                key={item.slug}
                actionLabel={t('page.news.channel4Action')}
                item={item}
                locale={locale}
              />
            ))}
            {channelItems.length === 0 ? (
              <p className="rounded border border-border bg-white p-6 text-sm leading-6 text-text-light">
                {t('page.news.pendingLabel')}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
