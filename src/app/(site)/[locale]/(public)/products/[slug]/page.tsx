import '@/styles/legacy-product-detail.css';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductDetailScrollReset } from '@/components/product/ProductDetailScrollReset';
import {
  ProductCareInstructions,
  ProductFaqList,
  ProductHeroCard,
  ProductIntroSection,
  ProductQualityEvidence,
  ProductScenarios,
  ProductSellingPoints,
  ProductSidebarNav,
  ProductSizeGuideTable,
  ProductSpecTable,
  ProductVisualGroups,
} from '@/components/product-detail/sections';
import { JsonLd } from '@/components/public/JsonLd';
import { getCmsProductBySlug, getCmsProductStaticParams } from '@/lib/cms/products';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import { buildSectionPropsFromCms } from '@/lib/content/buildSectionProps';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocaleAndSlug, type LocaleSlugRouteParams } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { localizedPublicText } from '@/lib/product/publicText';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, faqPageJsonLd, productJsonLd } from '@/lib/seo/jsonld';

type ProductDetailPageProps = Readonly<{
  params: LocaleSlugRouteParams;
}>;

export const revalidate = 300;

export async function generateStaticParams() {
  return getCmsProductStaticParams();
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { locale, slug } = await resolveRouteLocaleAndSlug(params);
  const isDraft = await isDraftModeEnabled();
  const product = await getCmsProductBySlug(locale, slug, isDraft);

  if (!product) {
    return {};
  }

  const productTitle = localizedPublicText(product.name, locale) || product.id;
  const productDescription = localizedPublicText(product.description, locale) || productTitle;

  return buildPageMetadata({
    locale,
    path: `/products/${product.id}`,
    title: productTitle,
    description: productDescription,
    image: product.image || '/images/headers/products-center.png',
    noIndex: isDraft,
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { locale, slug } = await resolveRouteLocaleAndSlug(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const product = await getCmsProductBySlug(locale, slug, isDraft);

  if (!product) {
    notFound();
  }

  const siteSettings = await getCmsSiteSettings(locale);
  const { faqEntries, productTitle, sections } = buildSectionPropsFromCms(product, locale, t);
  const jsonLdData: Array<Record<string, unknown>> = [
    productJsonLd(product, locale, siteSettings),
    breadcrumbJsonLd([
      { name: t('nav.home'), path: localizedPath(locale, '/') },
      { name: t('page.products.title'), path: localizedPath(locale, '/products') },
      {
        name: productTitle,
        path: localizedPath(locale, `/products/${product.id}`),
      },
    ]),
  ];

  if (faqEntries.length > 0) {
    jsonLdData.push(
      faqPageJsonLd(product.faqs, locale, localizedPath(locale, `/products/${product.id}`)),
    );
  }

  return (
    <>
      <JsonLd data={jsonLdData} />
      <ProductDetailScrollReset />

      <main className="detail-page">
        <section className="detail-page-shell">
          <div className="container">
            <div className="breadcrumb" aria-label={productTitle}>
              <Link href={`/${locale}`}>{t('nav.home')}</Link>
              <span>/</span>
              <Link href={`/${locale}/products`}>{t('page.products.title')}</Link>
              <span>/</span>
              <span>{productTitle}</span>
            </div>

            <div className="detail-layout">
              {sections.sidebar ? <ProductSidebarNav {...sections.sidebar} /> : null}

              <div className="detail-content">
                <ProductHeroCard {...sections.hero} />

                {sections.intro ? (
                  <section id="product-intro" className="detail-section detail-intro-section">
                    <ProductIntroSection {...sections.intro} />
                  </section>
                ) : null}

                {sections.sellingPoints ? (
                  <section id="selling-points" className="detail-section">
                    <ProductSellingPoints {...sections.sellingPoints} />
                  </section>
                ) : null}

                {sections.specifications ? (
                  <section id="specifications" className="detail-section">
                    <ProductSpecTable {...sections.specifications} />
                  </section>
                ) : null}

                {sections.sizeGuide ? (
                  <section id="size-guide" className="detail-section">
                    <ProductSizeGuideTable {...sections.sizeGuide} />
                  </section>
                ) : null}

                {sections.scenarios ? (
                  <section id="application-scenarios" className="detail-section">
                    <ProductScenarios {...sections.scenarios} />
                  </section>
                ) : null}

                {sections.visualGroups ? (
                  <section id="visual-gallery" className="detail-section">
                    <ProductVisualGroups {...sections.visualGroups} />
                  </section>
                ) : null}

                {sections.qualityEvidence ? (
                  <section id="quality-evidence" className="detail-section">
                    <ProductQualityEvidence {...sections.qualityEvidence} />
                  </section>
                ) : null}

                {sections.care ? (
                  <section id="care-instructions" className="detail-section detail-section-compact">
                    <ProductCareInstructions {...sections.care} />
                  </section>
                ) : null}

                {sections.faq ? (
                  <section id="faq" className="detail-section">
                    <ProductFaqList {...sections.faq} />
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
