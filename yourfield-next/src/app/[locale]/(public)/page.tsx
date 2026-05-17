import Image from 'next/image';
import Link from 'next/link';

import { ProductCard } from '@/components/product/ProductCard';
import { JsonLd } from '@/components/public/JsonLd';
import { SectionIntro } from '@/components/public/SectionIntro';
import { Carousel } from '@/components/ui/Carousel';
import { ArrowRightIcon } from '@/components/ui/icons';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { newsItems } from '@/lib/mock/news';
import { featuredProducts } from '@/lib/mock/products';
import { buildPageMetadata } from '@/lib/seo/buildMetadata';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';

type LocalePageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

const capabilityKeys = [
  'rd',
  'manufacturing',
  'standards',
  'industries',
  'custom',
  'delivery',
] as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/',
    title: t('home.hero.title'),
    description: t('home.hero.subtitle'),
    image: '/images/home/hero-video-poster.jpg',
  });
}

export default async function LocalePage({ params }: LocalePageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const previewProducts = featuredProducts;
  const previewNews = newsItems.slice(0, 3);

  return (
    <>
      <JsonLd data={[organizationJsonLd(locale), websiteJsonLd(locale)]} />

      <section className="relative isolate overflow-hidden bg-primary text-white">
        <Image
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src="/images/home/hero-video-poster.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div className="via-primary/82 to-primary/35 absolute inset-0 -z-10 bg-gradient-to-r from-primary-dark" />
        <div className="container flex min-h-[620px] flex-col justify-center py-20 md:min-h-[680px] md:py-24 xl:min-h-[720px]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] !text-white">
              {t('home.hero.kicker')}
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight text-white md:text-6xl">
              {t('home.hero.title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 !text-white md:text-xl">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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

      <section className="bg-white py-14">
        <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['2002', t('home.stats.years')],
            ['500+', t('home.stats.employees')],
            ['32', t('home.stats.countries')],
            ['120+', t('home.stats.fortune')],
          ].map(([value, label]) => (
            <div key={label} className="border-l-4 border-accent bg-bg-light p-6">
              <div className="text-3xl font-bold text-primary">{value}</div>
              <p className="mt-2 text-sm font-semibold text-text-light">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('home.capabilities.tag')}
            title={t('home.capabilities.title')}
            text={t('home.capabilities.description')}
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilityKeys.map((key) => (
              <article key={key} className="rounded border border-border bg-white p-6 shadow-sm">
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded bg-primary text-sm font-bold text-white">
                  {String(capabilityKeys.indexOf(key) + 1).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-bold text-primary">
                  {t(`home.capabilities.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-light">
                  {t(`home.capabilities.${key}.text`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              align="left"
              eyebrow={t('home.products.tag')}
              title={t('home.products.title')}
              text={t('home.products.description')}
            />
            <Link className="btn btn-secondary shrink-0" href={`/${locale}/products`}>
              {t('common.viewAllProducts')}
            </Link>
          </div>
          <Carousel
            ariaLabel={t('home.products.title')}
            autoScroll
            className="mt-2"
            containerClassName="-ml-6"
            controls={{
              previousLabel: t('home.products.previous'),
              nextLabel: t('home.products.next'),
            }}
            options={{ loop: true }}
            slideClassName="flex-[0_0_86%] pl-6 sm:flex-[0_0_50%] xl:flex-[0_0_25%]"
          >
            {previewProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                detailLabel={t('common.viewDetails')}
              />
            ))}
          </Carousel>
        </div>
      </section>

      <section className="bg-bg-light py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="section-tag">{t('home.about.tag')}</p>
            <h2>{t('home.about.title')}</h2>
            <p className="mt-5">{t('home.about.body1')}</p>
            <p className="mt-4">{t('home.about.body2')}</p>
            <ul className="mt-6 grid gap-3 text-sm font-semibold text-primary">
              {['home.about.feature1', 'home.about.feature2', 'home.about.feature3'].map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <Link className="btn btn-primary mt-8" href={`/${locale}/about`}>
              {t('home.about.learnMore')}
            </Link>
          </div>
          <div className="bg-primary/5 relative aspect-[4/3] overflow-hidden rounded shadow-lg">
            <Image
              className="h-full w-full object-cover"
              src="/images/about/yourfield-campus.png"
              alt={t('home.about.imageAlt')}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
        </div>
      </section>

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
              <article key={item.slug} className="rounded border border-border bg-bg-light p-6">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                  {t(item.dateKey)}
                </p>
                <h3 className="mt-3 text-xl font-bold text-primary">
                  <Link href={`/${locale}/news/${item.slug}`}>{t(item.titleKey)}</Link>
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-light">
                  {t(item.excerptKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
