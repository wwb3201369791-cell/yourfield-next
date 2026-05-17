import Link from 'next/link';

import { ProductCard } from '@/components/product/ProductCard';
import { CtaBand } from '@/components/public/CtaBand';
import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import {
  getProductsByGroup,
  localized,
  productGroups,
  products,
  type Product,
} from '@/lib/mock/products';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata, localizedPath } from '@/lib/seo/metadata';

type ProductsPageProps = Readonly<{
  params: {
    locale: string;
  };
  searchParams?: {
    q?: string;
  };
}>;

function filterProducts(locale: ReturnType<typeof resolveRouteLocale>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return products;
  }

  return products.filter((product) => {
    const haystack = [
      product.id,
      product.model,
      product.sku,
      localized(product.name, locale),
      localized(product.categoryName, locale),
      localized(product.description, locale),
      ...product.standards,
      ...product.features.map((feature) => localized(feature, locale)),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function ProductSection({
  locale,
  title,
  products: sectionProducts,
  detailLabel,
}: Readonly<{
  locale: ReturnType<typeof resolveRouteLocale>;
  title: string;
  products: readonly Product[];
  detailLabel: string;
}>) {
  if (sectionProducts.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-28 py-8">
      <h2 className="mb-5 text-2xl font-bold text-primary">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {sectionProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            detailLabel={detailLabel}
          />
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: ProductsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/products',
    title: t('page.products.title'),
    description: t('home.products.description'),
    image: '/images/headers/products-center.png',
  });
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const query = searchParams?.q ?? '';
  const visibleProducts = filterProducts(locale, query);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(
            t('page.products.title'),
            t('home.products.description'),
            localizedPath(locale, '/products'),
          ),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.products.title'), path: localizedPath(locale, '/products') },
          ]),
        ]}
      />
      <PageHero
        title={t('page.products.title')}
        description={t('home.products.description')}
        image="/images/headers/products-center.png"
        imageAlt={t('page.products.title')}
        priority
      />

      <section className="bg-bg-light py-10">
        <div className="container flex flex-wrap gap-3">
          {productGroups.map((group) => (
            <Link
              key={group.id}
              className="border-primary/15 rounded-full border bg-white px-4 py-2 text-sm font-bold text-primary hover:border-accent hover:text-accent"
              href={`#${group.id}`}
            >
              {t(group.titleKey)}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <div className="container">
          {query.trim() ? (
            <div className="mb-8 rounded border border-border bg-bg-light p-5">
              <p className="text-sm font-semibold text-text-light">
                {t('search.results')}: <span className="text-primary">{query}</span>
              </p>
            </div>
          ) : null}

          {productGroups.map((group) => (
            <div key={group.id} id={group.id}>
              <ProductSection
                locale={locale}
                title={t(group.titleKey)}
                products={
                  query.trim()
                    ? visibleProducts.filter((product) => product.groupId === group.id)
                    : getProductsByGroup(group.id)
                }
                detailLabel={t('common.viewDetails')}
              />
            </div>
          ))}

          {visibleProducts.length === 0 ? (
            <div className="rounded border border-border bg-bg-light p-8 text-center">
              <h2 className="text-2xl font-bold text-primary">{t('search.noResultsTitle')}</h2>
              <p className="mt-3">{t('search.noResults')}</p>
            </div>
          ) : null}
        </div>
      </section>

      <CtaBand
        title={t('page.products.ctaTitle')}
        text={t('page.products.ctaText')}
        primaryHref={`/${locale}/contact`}
        primaryLabel={t('common.contactSales')}
        secondaryHref={`/${locale}/solutions`}
        secondaryLabel={t('page.products.viewSolutions')}
      />
    </>
  );
}
