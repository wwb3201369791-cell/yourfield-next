import '@/styles/legacy-products.css';

import Link from 'next/link';

import {
  ProductCatalog,
  type OfficialCatalogSlotView,
  type ProductCatalogGroupView,
} from '@/components/product/ProductCatalog';
import { JsonLd } from '@/components/public/JsonLd';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { getCmsProductGroups, getCmsProducts, type CmsProductGroup } from '@/lib/cms/products';
import { productPrimaryImage } from '@/lib/content/productVisuals';
import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type ProductsPageProps = Readonly<{
  params: LocaleRouteParams;
  searchParams?: Promise<{
    group?: string;
    q?: string;
  }>;
}>;

type ProductGroupDefinition = Readonly<{
  description?: string;
  id: string;
  title: string;
}>;

type LocalizedText = Readonly<Record<Locale, string>>;
type CmsProduct = Awaited<ReturnType<typeof getCmsProducts>>[number];

type CatalogSlot = Readonly<{
  categoryDescription: LocalizedText;
  categoryId: string;
  categoryIndex: number;
  categoryTitle: LocalizedText;
  cmsProduct: CmsProduct;
  description: LocalizedText;
  fallbackTitle: LocalizedText;
  groupId: string;
  image: string;
  model: string;
  number: string;
  sequence: number;
  slotId: string;
  standards: readonly string[];
  status: 'published';
  title: LocalizedText;
}>;

export const revalidate = 300;

function sortCatalogSlots(left: CatalogSlot, right: CatalogSlot) {
  return left.sequence - right.sequence;
}

function catalogSlotNumber(sequence: number) {
  return `NO.${String(sequence).padStart(2, '0')}`;
}

function localized(value: LocalizedText, locale: Locale) {
  return value[locale] || value.zh;
}

function localizedText(value: string): LocalizedText {
  return {
    zh: value,
    en: value,
    ru: value,
  };
}

function filterCatalogSlots(
  slots: readonly CatalogSlot[],
  locale: Locale,
  query: string,
): readonly CatalogSlot[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return slots;
  }

  return slots.filter((slot) => {
    const haystack = [
      slot.slotId,
      slot.number,
      slot.model,
      localized(slot.title, locale),
      localized(slot.categoryTitle, locale),
      localized(slot.categoryDescription, locale),
      slot.cmsProduct.sku,
      ...slot.cmsProduct.features.map((feature) => localized(feature, locale)),
      ...slot.standards,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function buildCmsCatalogSlots(
  products: Awaited<ReturnType<typeof getCmsProducts>>,
  groups: readonly ProductGroupDefinition[],
): readonly CatalogSlot[] {
  const groupById = new Map(groups.map((group) => [group.id, group]));

  return products.map((product, index) => {
    const sequence = index + 1;
    const group = groupById.get(product.groupId);
    const groupTitle = group?.title ?? localized(product.categoryName, 'zh') ?? product.groupId;
    const groupDescription =
      group?.description ?? localized(product.description, 'zh') ?? groupTitle;

    return {
      categoryDescription: localizedText(groupDescription),
      categoryId: product.groupId || product.id,
      categoryIndex: sequence,
      categoryTitle: localizedText(groupTitle),
      cmsProduct: product,
      description: product.description,
      fallbackTitle: product.name,
      groupId: product.groupId,
      image: productPrimaryImage(product),
      model: product.model,
      number: catalogSlotNumber(sequence),
      sequence,
      slotId: product.id,
      standards: product.standards,
      status: 'published',
      title: product.name,
    } satisfies CatalogSlot;
  });
}

function buildDynamicHashTargets(groups: readonly Pick<CmsProductGroup, 'id'>[]) {
  const targets: Record<string, { categoryIds: readonly string[]; groupId: string }> = {};

  for (const group of groups) {
    targets[group.id] = {
      categoryIds: [],
      groupId: group.id,
    };
  }

  return targets;
}

function catalogSummary(items: readonly string[], maxItems = 4) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
    .slice(0, maxItems)
    .join(' / ');
}

export async function generateMetadata({ params }: ProductsPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'products-index', isDraft);
  const metadataImage = page?.seoImage || page?.heroImage || '/images/headers/products-center.png';

  return buildPageMetadata({
    locale,
    path: '/products',
    title: page?.seoTitle || page?.title || t('page.products.title'),
    description: page?.seoDescription || page?.heroSubtitle || t('home.products.description'),
    image: metadataImage,
    canonical: page?.seoCanonical,
    keywords: page?.seoKeywords,
    noIndex: isDraft || Boolean(page?.noIndex),
  });
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const query = resolvedSearchParams.q ?? '';
  const [cmsProducts, cmsProductGroups] = await Promise.all([
    getCmsProducts(locale, isDraft),
    getCmsProductGroups(locale),
  ]);
  const groupDefinitions: ProductGroupDefinition[] = cmsProductGroups.map((group) => ({
    ...(group.description ? { description: group.description } : {}),
    id: group.id,
    title: group.title,
  }));
  const groupTitleById = new Map(groupDefinitions.map((group) => [group.id, group.title]));
  const catalogSlots = buildCmsCatalogSlots(cmsProducts, groupDefinitions);
  const filteredCatalogSlots = filterCatalogSlots(catalogSlots, locale, query);

  function catalogSlotView(slot: CatalogSlot, displaySequence: number): OfficialCatalogSlotView {
    const detailAvailable = slot.status === 'published' && Boolean(slot.cmsProduct);
    const productSlug = slot.cmsProduct?.id ?? slot.slotId;

    return {
      categoryDescription: localized(slot.description, locale),
      categoryId: slot.categoryId,
      categoryTitle: localized(slot.categoryTitle, locale),
      ctaLabel: detailAvailable ? t('common.viewDetails') : t('common.contactSales'),
      detailAvailable,
      groupId: slot.groupId,
      groupTitle: groupTitleById.get(slot.groupId) ?? slot.groupId,
      href: detailAvailable
        ? `/${locale}/products/${productSlug}`
        : `/${locale}/contact?product=${encodeURIComponent(slot.slotId)}`,
      image: slot.image,
      model: slot.model,
      number: catalogSlotNumber(displaySequence),
      sequence: displaySequence,
      slotId: slot.slotId,
      standards: slot.standards,
      status: slot.status,
      statusLabel: detailAvailable
        ? t('products.catalog.detailReady')
        : t('products.catalog.placeholderReady'),
      title: localized(slot.title, locale),
    };
  }

  let displaySequence = 0;
  const catalogGroupViews = groupDefinitions
    .map<ProductCatalogGroupView | null>((group) => {
      const groupSlots = filteredCatalogSlots
        .filter((slot) => slot.groupId === group.id)
        .sort(sortCatalogSlots);

      if (groupSlots.length === 0) {
        return null;
      }

      const categorySummary =
        catalogSummary(groupSlots.map((slot) => localized(slot.title, locale))) ||
        group.description ||
        group.title;

      return {
        categorySummary,
        id: group.id,
        slots: groupSlots.map((slot) => {
          displaySequence += 1;
          return catalogSlotView(slot, displaySequence);
        }),
        title: group.title,
      };
    })
    .filter((group): group is ProductCatalogGroupView => Boolean(group));
  const catalogHashTargets = buildDynamicHashTargets(cmsProductGroups);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(
            t('page.products.title'),
            t('home.products.description'),
            localizedPath(locale, '/products'),
            cmsProducts.map((product) => ({
              name: localized(product.name, locale),
              path: localizedPath(locale, `/products/${product.id}`),
            })),
          ),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.products.title'), path: localizedPath(locale, '/products') },
          ]),
        ]}
      />

      <section className="page-header products-page-header" aria-labelledby="products-page-title">
        <div className="container">
          <h1 id="products-page-title">{t('page.products.title')}</h1>
          <div className="divider" aria-hidden="true" />
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{t('nav.home')}</Link>
            <span aria-hidden="true">/</span>
            <span>{t('page.products.title')}</span>
          </nav>
        </div>
      </section>

      <section className="product-categories">
        <div className="container" data-product-catalog>
          <ProductCatalog
            emptyState={
              query.trim()
                ? {
                    text: t('search.noResults'),
                    title: t('search.noResultsTitle'),
                  }
                : {
                    text: t('products.catalog.emptyFilterText'),
                    title: t('products.catalog.emptyFilterTitle'),
                  }
            }
            groups={catalogGroupViews}
            hashTargets={catalogHashTargets}
            labels={{
              categoryFilter: t('products.catalog.filterLabel'),
              coverage: t('products.catalog.coverage'),
              next: t('products.catalog.railNext'),
              previous: t('products.catalog.railPrevious'),
              queryPrefix: t('search.results'),
            }}
            overview={{
              eyebrow: t('products.catalog.officialTaxonomy'),
              text: t('products.catalog.currentPublishedText'),
              title: t('products.catalog.taxonomyTitle'),
            }}
            query={query}
          />
        </div>
      </section>
    </>
  );
}
