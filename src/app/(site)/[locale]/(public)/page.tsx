import '@/styles/legacy-home.css';

import Image from 'next/image';
import Link from 'next/link';

import { HeroBackgroundVideo } from '@/components/home/HeroBackgroundVideo';
import { HeroCopyRotator, type HeroCopyRotatorSlide } from '@/components/home/HeroCopyRotator';
import {
  HomeCertificationsSection,
  type HomeCertificationItem,
} from '@/components/home/HomeCertificationsSection';
import { HomeIndustrySection, type HomeIndustrySlide } from '@/components/home/HomeIndustrySection';
import { HomeInlineVideoCard } from '@/components/home/HomeInlineVideoCard';
import { HomeNewsPreviewCard } from '@/components/home/HomeNewsPreviewCard';
import {
  HomePartnersSection,
  type HomePartnerShowcaseItem,
} from '@/components/home/HomePartnersSection';
import {
  HomeProductPreviewSection,
  type HomeProductPreviewView,
  type HomeProductScenarioView,
} from '@/components/home/HomeProductPreviewSection';
import { JsonLd } from '@/components/public/JsonLd';
import { SectionIntro } from '@/components/public/SectionIntro';
import { ArrowRightIcon } from '@/components/ui/icons';
import { getHomeFeaturedProducts } from '@/lib/cms/home';
import { getCmsNews, getFeaturedNewsItems } from '@/lib/cms/news';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import {
  capabilityCards,
  certificationItems,
  industrySlides,
  partnerCards,
  processSteps,
} from '@/lib/home/homeConfig';
import { buildHomeProductScenarios } from '@/lib/home/productScenarios';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';
import { getHomeHeroVideo } from '@/lib/media/localizedVideos';
import { resolvePublicVideoUrl } from '@/lib/media/publicAsset';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { localized, type ProductGroupId } from '@/lib/product/types';
import { buildPageMetadata } from '@/lib/seo/buildMetadata';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';

type LocalePageProps = Readonly<{
  params: LocaleRouteParams;
}>;

export const revalidate = 300;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/',
    title: t('home.hero.title'),
    description: t('home.hero.subtitle'),
    image: '/images/home/franchise-campus-hero-clean-hd.jpg',
    noIndex: isDraft,
  });
}

export default async function LocalePage({ params }: LocalePageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const [previewProducts, newsItems, siteSettings] = await Promise.all([
    getHomeFeaturedProducts(locale, isDraft),
    getCmsNews(locale, isDraft),
    getCmsSiteSettings(locale),
  ]);
  const previewNews = getFeaturedNewsItems(newsItems);
  const homePreviewProducts = previewProducts.slice(0, 5);
  const productsHref = `/${locale}/products`;
  const productGroupHref = (group: ProductGroupId) => `${productsHref}?group=${group}#${group}`;
  const homeProductScenarios: readonly HomeProductScenarioView[] = buildHomeProductScenarios(
    homePreviewProducts,
    locale,
  );
  const homeProductCards: readonly HomeProductPreviewView[] = homePreviewProducts.map(
    (product) => ({
      categoryName: localized(product.categoryName, locale),
      description: localized(product.description, locale),
      detailHref: `${productsHref}/${product.id}`,
      groupId: product.groupId,
      id: product.id,
      image: product.image,
      name: localized(product.name, locale),
      viewMoreHref: productGroupHref(product.groupId),
    }),
  );
  const homeIndustrySlides: readonly HomeIndustrySlide[] = industrySlides.map((industry) => ({
    action: t('home.industry.viewProducts'),
    href: productGroupHref(industry.group),
    image: industry.image,
    text: t(industry.textKey),
    title: t(industry.titleKey),
  }));
  const homePartnerCards: readonly HomePartnerShowcaseItem[] = partnerCards.map((partner) => ({
    href: `${productsHref}#${partner.hrefHash}`,
    image: partner.image,
    name: partner.name,
    sector: t(partner.sectorKey),
    summary: t(partner.summaryKey),
    visualTitle: t(partner.visualKey),
  }));
  const homeCertificationItems: readonly HomeCertificationItem[] = certificationItems.map(
    (cert) => ({
      detail: t(cert.detailKey),
      icon: cert.title.startsWith('GB') ? 'GB/T' : 'ISO',
      image: cert.image,
      meta: t(cert.metaKey),
      title: cert.title,
    }),
  );

  const heroSlides: readonly HeroCopyRotatorSlide[] = [
    {
      title1: t('home.hero.slide1.title1'),
      title2: t('home.hero.slide1.title2'),
      text: t('home.hero.slide1.text'),
    },
    {
      title1: t('home.hero.slide2.title1'),
      title2: t('home.hero.slide2.title2'),
      text: t('home.hero.slide2.text'),
    },
    {
      title1: t('home.hero.slide3.title1'),
      title2: t('home.hero.slide3.title2'),
      text: t('home.hero.slide3.text'),
    },
  ];
  const heroVideo = getHomeHeroVideo(locale);

  return (
    <>
      <JsonLd
        data={[organizationJsonLd(locale, siteSettings), websiteJsonLd(locale, siteSettings)]}
      />

      <section className="home-hero relative isolate overflow-hidden bg-primary text-white">
        <HeroBackgroundVideo
          loopSrc={heroVideo.loop.src}
          fullSrc={heroVideo.full.src}
          posterSrc={heroVideo.poster}
          modalPoster={heroVideo.modalPoster}
          copy={{
            watchFull: t('home.hero.video.watchFull'),
            mute: t('home.hero.video.muteBackground'),
            unmute: t('home.hero.video.unmuteBackground'),
            modalTitle: t('home.hero.video.watchFull'),
            modalClose: t('common.close'),
          }}
        />
        <div className="via-primary/75 to-primary/35 from-primary-dark/90 absolute inset-0 -z-10 bg-gradient-to-r" />
        <div className="home-hero__inner container relative flex min-h-[620px] flex-col justify-start py-20 md:min-h-[680px] md:py-24 xl:min-h-[720px]">
          <div className="home-hero-copy-shell">
            <HeroCopyRotator slides={heroSlides} />
            <div className="home-hero-buttons mt-8 flex flex-wrap gap-3">
              <Link className="btn btn-primary gap-2" href={`/${locale}/products`}>
                {t('home.hero.products')}
                <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
              </Link>
              <Link className="btn btn-outline" href={`/${locale}/contact`}>
                {t('home.hero.contact')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {[
              ['2002', t('home.stats.years')],
              ['32+', t('home.stats.countries')],
              ['120+', t('home.stats.fortune')],
              ['60+', t('home.stats.patents')],
            ].map(([value, label]) => (
              <div key={label} className="stat-item">
                <div className="stat-number">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-capability-overview" id="capability-overview">
        <div className="container">
          <div className="capability-overview-head">
            <span className="section-tag">{t('home.capabilities.tag')}</span>
            <h2>{t('home.capabilities.title')}</h2>
            <p>{t('home.capabilities.description')}</p>
          </div>

          <div className="capability-overview-layout">
            <div className="capability-overview-story">
              <div className="home-about-heading home-about-heading--compact">
                <h3>{t('home.about.title')}</h3>
                <span aria-hidden="true" />
              </div>
              <p>{t('home.about.body1')}</p>
              <p>{t('home.about.body2')}</p>
              <Link
                className="home-about-more"
                href={`/${locale}/about`}
                aria-label={t('home.about.learnMore')}
              >
                <span>{t('home.about.learnMore')}</span>
                <span className="home-about-more__icon" aria-hidden="true" />
              </Link>

              <HomeInlineVideoCard
                label={t('home.hero.play')}
                poster="/images/about/yourfield-campus.png"
                src={resolvePublicVideoUrl('/video/about.mp4')}
              />
            </div>

            <div className="capability-overview-proof">
              <div className="capability-overview-proof__intro">
                <div className="capability-overview-proof__copy">
                  <span>{t('home.scale.tag')}</span>
                  <strong>{t('home.scale.title')}</strong>
                  <p>{t('home.scale.description')}</p>
                </div>
                <figure className="capability-overview-park-media" aria-hidden="true">
                  <Image
                    src="/images/about/yourfield-campus.png"
                    alt=""
                    fill
                    sizes="(min-width: 1180px) 230px, 45vw"
                  />
                  <span className="park-media-grid" />
                  <span className="park-media-scan" />
                </figure>
              </div>

              <div className="capability-overview-stats" aria-label={t('home.about.metric.aria')}>
                {[
                  {
                    className: 'capability-overview-stat--area',
                    image: '/images/about/built-up-area-stat.jpg',
                    value: '160000',
                    unit: t('home.scale.areaUnit'),
                    label: t('home.scale.area'),
                  },
                  {
                    className: 'capability-overview-stat--park',
                    image: '/images/about/franchise-campus.jpg',
                    value: '128',
                    unit: t('home.scale.landUnit'),
                    label: t('home.scale.land'),
                  },
                  {
                    className: 'capability-overview-stat--ppe',
                    image: '/images/about/yourfield-sewing-2.jpg',
                    value: '1.2M',
                    unit: t('home.scale.capacityUnit'),
                    label: t('home.scale.specialPpe'),
                  },
                  {
                    className: 'capability-overview-stat--medical',
                    image: '/images/about/yourfield-medical-2.png',
                    value: '15.6M',
                    unit: t('home.scale.capacityUnit'),
                    label: t('home.scale.medicalPpe'),
                  },
                ].map((stat) => (
                  <article
                    key={stat.className}
                    className={`capability-overview-stat ${stat.className}`}
                  >
                    <span className="stat-visual" aria-hidden="true">
                      <Image src={stat.image} alt="" fill sizes="(min-width: 1180px) 24vw, 50vw" />
                    </span>
                    <span className="stat-content">
                      <span className="stat-value">
                        <strong className="stat-number">{stat.value}</strong>
                        <span className="stat-unit">{stat.unit}</span>
                      </span>
                      <span className="stat-label">{stat.label}</span>
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="capability-overview-system">
            <div className="capability-overview-cards">
              {capabilityCards.map((card) => (
                <article key={card.key} className={`capability-card ${card.className}`}>
                  <div className="capability-card__body">
                    <span className="capability-code">{card.code}</span>
                    <h3>{t(`home.capabilities.${card.key}.title`)}</h3>
                    <p>{t(`home.capabilities.${card.key}.text`)}</p>
                  </div>
                  <figure className="capability-card__media" aria-hidden="true">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(min-width: 1180px) 28vw, (min-width: 768px) 45vw, 100vw"
                    />
                  </figure>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="products" id="product-preview">
        <Link
          className="products-hero products-hero-link"
          href={productsHref}
          style={{ backgroundImage: "url('/images/headers/products-center.png')" }}
        >
          <div className="container">
            <div className="products-hero-content">
              <h2>{t('home.products.hero')}</h2>
              <div className="divider" />
            </div>
          </div>
        </Link>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('home.products.tag')}</span>
            <h2>{t('home.products.title')}</h2>
            <p>{t('home.products.description')}</p>
          </div>
          <HomeProductPreviewSection
            emptyText={t('home.products.loading')}
            products={homeProductCards}
            scenarioLabel={t('home.products.scenarioLabel')}
            scenarios={homeProductScenarios}
            viewMoreLabel={t('home.products.viewMore')}
          />
        </div>
      </section>

      <section className="inquiry-process">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('home.process.tag')}</span>
            <h2>{t('home.process.title')}</h2>
            <p>{t('home.process.description')}</p>
          </div>
          <div className="process-grid" role="list" aria-label={t('home.process.ariaLabel')}>
            {processSteps.map((step) => (
              <article key={step.code} className={`process-step ${step.className}`} role="listitem">
                <figure className="process-step__media" aria-hidden="true">
                  <Image src={step.image} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" />
                </figure>
                <div className="process-step__body">
                  <span className="process-index">{step.code}</span>
                  <h3>{t(step.titleKey)}</h3>
                  <p>{t(step.textKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HomeIndustrySection
        ariaLabel={t('home.industries.ariaLabel')}
        slides={homeIndustrySlides}
        tag={t('home.industries.tag')}
        title={t('home.industries.title')}
      />

      <HomePartnersSection
        ariaLabel={t('home.partners.ariaLabel')}
        clientsMetric={t('home.partners.metric.clients')}
        industriesMetric={t('home.partners.metric.industries')}
        items={homePartnerCards}
        linkLabel={t('home.partners.viewScenario')}
        metricsAriaLabel={t('home.partners.metricsAriaLabel')}
        projectsMetric={t('home.partners.metric.experience')}
        tag={t('home.partners.tag')}
        text={t('home.partners.text')}
        title={t('home.partners.title')}
        visualAlt={t('home.partners.visualAlt')}
      />

      <HomeCertificationsSection
        currentFocusLabel={t('home.certs.currentFocus')}
        description={t('home.certs.description')}
        items={homeCertificationItems}
        matrixAriaLabel={t('home.certs.matrixAria')}
        summaryAriaLabel={t('home.certs.summaryAria')}
        summaryScopes={t('home.certs.summaryScopes')}
        summarySince={t('home.certs.summarySince')}
        summaryStandards={t('home.certs.summaryStandards')}
        tag={t('home.certs.tag')}
        title={t('home.certs.title')}
        visualSystemLabel={t('home.certs.visualSystem')}
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              align="left"
              eyebrow={t('page.news.channelsTag')}
              title={t('page.news.channelsTitle')}
              text={t('page.news.ctaText')}
            />
            <Link className="btn btn-secondary shrink-0" href={`/${locale}/news`}>
              {t('nav.news')}
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {previewNews.map((item) => (
              <HomeNewsPreviewCard
                key={item.slug}
                actionLabel={t('page.news.detailOpenLabel')}
                item={item}
                locale={locale}
              />
            ))}
            {previewNews.length === 0 ? (
              <p className="rounded border border-border bg-bg-light p-6 text-sm leading-6 text-text-light lg:col-span-3">
                {t('page.news.pendingLabel')}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
