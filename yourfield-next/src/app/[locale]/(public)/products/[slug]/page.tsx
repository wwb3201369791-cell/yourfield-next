import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CtaBand } from '@/components/public/CtaBand';
import { JsonLd } from '@/components/public/JsonLd';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { locales } from '@/lib/i18n/locale';
import { resolveRouteLocale } from '@/lib/i18n/route';
import {
  featuredProducts,
  getProductBySlug,
  localized,
  products,
  specValue,
} from '@/lib/mock/products';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata, localizedPath } from '@/lib/seo/metadata';

type ProductDetailPageProps = Readonly<{
  params: {
    locale: string;
    slug: string;
  };
}>;

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((product) => ({ locale, slug: product.id })));
}

export function generateMetadata({ params }: ProductDetailPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const product = getProductBySlug(params.slug);

  if (!product) {
    return {};
  }

  return buildPageMetadata({
    locale,
    path: `/products/${product.id}`,
    title: localized(product.name, locale),
    description: localized(product.description, locale),
    image: product.image,
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = featuredProducts
    .filter((item) => item.id !== product.id && item.groupId === product.groupId)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product, locale),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.products.title'), path: localizedPath(locale, '/products') },
            {
              name: localized(product.name, locale),
              path: localizedPath(locale, `/products/${product.id}`),
            },
          ]),
        ]}
      />

      <section className="bg-bg-light py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="grid gap-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded bg-white shadow-lg">
              <Image
                className="h-full w-full object-contain p-8"
                src={product.image}
                alt={localized(product.name, locale)}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((image, index) => (
                <div
                  key={image}
                  className="relative aspect-square overflow-hidden rounded border border-border bg-white"
                >
                  <Image
                    className="h-full w-full object-contain p-3"
                    src={image}
                    alt={localized(product.name, locale)}
                    fill
                    priority={index === 0}
                    sizes="120px"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="section-tag">{localized(product.categoryName, locale)}</p>
            <h1 className="text-4xl font-bold text-primary md:text-5xl">
              {localized(product.name, locale)}
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-light">
              {localized(product.description, locale)}
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded border border-border bg-white p-5">
                <dt className="text-sm font-bold text-text-light">{t('product.detail.model')}</dt>
                <dd className="mt-1 text-xl font-bold text-primary">{product.model}</dd>
              </div>
              <div className="rounded border border-border bg-white p-5">
                <dt className="text-sm font-bold text-text-light">
                  {t('product.detail.category')}
                </dt>
                <dd className="mt-1 text-xl font-bold text-primary">
                  {localized(product.categoryName, locale)}
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn btn-primary" href={`/${locale}/contact?product=${product.id}`}>
                {t('common.requestQuote')}
              </Link>
              <Link className="btn btn-secondary" href={`/${locale}/products`}>
                {t('common.viewAllProducts')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="section-tag">{t('product.detail.overview')}</p>
            <h2>{t('product.detail.features')}</h2>
            <div className="mt-6 grid gap-3">
              {product.features.map((feature) => (
                <div
                  key={localized(feature, locale)}
                  className="flex gap-3 rounded bg-bg-light p-4"
                >
                  <span className="mt-2 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  <p className="font-semibold text-primary">{localized(feature, locale)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="section-tag">{t('product.detail.specTag')}</p>
            <h2>{t('product.detail.specifications')}</h2>
            <dl className="mt-6 divide-y divide-border rounded border border-border bg-white">
              {product.specifications.map((spec) => (
                <div
                  key={localized(spec.label, locale)}
                  className="grid gap-2 p-4 sm:grid-cols-[180px_1fr]"
                >
                  <dt className="font-bold text-primary">{localized(spec.label, locale)}</dt>
                  <dd className="text-text-light">{specValue(spec.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-bg-light py-16 md:py-24">
        <div className="container grid gap-8 lg:grid-cols-2">
          <div>
            <p className="section-tag">{t('product.detail.applications')}</p>
            <h2>{t('product.detail.scenarioTag')}</h2>
            <div className="mt-6 grid gap-4">
              {product.applications.map((application) => (
                <article key={localized(application, locale)} className="rounded bg-white p-5">
                  <p className="font-semibold text-primary">{localized(application, locale)}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <p className="section-tag">{t('product.detail.faqTag')}</p>
            <h2>{t('product.detail.faq')}</h2>
            <div className="mt-6 grid gap-4">
              {product.faqs.map((faq) => (
                <article key={localized(faq.question, locale)} className="rounded bg-white p-5">
                  <h3 className="text-lg font-bold text-primary">
                    {localized(faq.question, locale)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-text-light">
                    {localized(faq.answer, locale)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="bg-white py-16 md:py-24">
          <div className="container">
            <p className="section-tag">{t('product.detail.relatedTag')}</p>
            <h2>{t('product.detail.relatedProducts')}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <article key={item.id} className="rounded border border-border bg-bg-light p-5">
                  <h3 className="text-xl font-bold text-primary">{localized(item.name, locale)}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-light">
                    {localized(item.description, locale)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CtaBand
        title={t('product.cta.title')}
        text={t('product.cta.text')}
        primaryHref={`/${locale}/contact?product=${product.id}`}
        primaryLabel={t('common.contactSales')}
        secondaryHref={`/${locale}/products`}
        secondaryLabel={t('common.viewAllProducts')}
      />
    </>
  );
}
