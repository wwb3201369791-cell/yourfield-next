import '@/styles/legacy-products.css';

import Link from 'next/link';

import {
  ProductCatalog,
  type OfficialCatalogSlotView,
  type ProductCatalogGroupView,
} from '@/components/product/ProductCatalog';
import { JsonLd } from '@/components/public/JsonLd';
import { getCmsProductGroups, getCmsProducts, type CmsProductGroup } from '@/lib/cms/products';
import {
  buildCatalogSlots,
  catalogSlotNumber,
  catalogCategories,
  catalogGroups,
  filterCatalogSlots,
  getCatalogHashTargets,
  localized,
  type CatalogSlot,
  type LocalizedText,
} from '@/lib/content/productCatalog';
import { productPrimaryImage } from '@/lib/content/productVisuals';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type ProductsPageProps = Readonly<{
  params: {
    locale: string;
  };
  searchParams?: {
    group?: string;
    q?: string;
  };
}>;

type ProductGroupDefinition = Readonly<{
  description?: string;
  id: string;
  title: string;
}>;

export const revalidate = 300;

const fallbackRepresentativeProductDisplayOrder = [
  'firefighter-suit-combat',
  'arc-flash-suit',
  'welding-protective-clothing',
  'chemical-protective-suit',
  'gan-shi-shui-yu-jiu-yuan-fu',
] as const;

const categoryDisplayOrder = new Map(
  catalogCategories.map((category, index) => [category.id, index]),
);
const fallbackRepresentativeProductOrder = new Map<string, number>(
  fallbackRepresentativeProductDisplayOrder.map((productId, index) => [productId, index]),
);

function productCategoryOrder(categoryId: string) {
  return categoryDisplayOrder.get(categoryId) ?? Number.MAX_SAFE_INTEGER;
}

function fallbackRepresentativeProductPriority(slotId: string) {
  const index = fallbackRepresentativeProductOrder.get(slotId);

  return index === undefined ? Number.MAX_SAFE_INTEGER : index;
}

function sortCatalogSlots(left: CatalogSlot, right: CatalogSlot, useCmsOrder: boolean) {
  if (useCmsOrder) {
    return left.sequence - right.sequence;
  }

  return (
    fallbackRepresentativeProductPriority(left.slotId) -
      fallbackRepresentativeProductPriority(right.slotId) ||
    productCategoryOrder(left.categoryId) - productCategoryOrder(right.categoryId) ||
    left.sequence - right.sequence
  );
}

function localizedText(value: string): LocalizedText {
  return {
    zh: value,
    en: value,
    ru: value,
  };
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
  const targets: Record<string, ReturnType<typeof getCatalogHashTargets>[string]> = {};

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
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/products',
    title: t('page.products.title'),
    description: t('home.products.description'),
    image: '/images/headers/products-center.png',
    noIndex: isDraft,
  });
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);
  const query = searchParams?.q ?? '';
  const [cmsProducts, cmsProductGroups] = await Promise.all([
    getCmsProducts(locale, isDraft),
    getCmsProductGroups(locale),
  ]);
  const useCmsCatalog = cmsProductGroups.length > 0;
  const groupDefinitions: ProductGroupDefinition[] = (
    useCmsCatalog
      ? cmsProductGroups.map((group) => ({
          ...(group.description ? { description: group.description } : {}),
          id: group.id,
          title: group.title,
        }))
      : catalogGroups.map((group) => ({
          id: group.id,
          title: t(group.titleKey),
        }))
  );
  const categoryDefinitions = useCmsCatalog
    ? []
    : catalogCategories.map((category) => ({
        id: category.id,
        groupId: category.groupId,
        title: localized(category.title, locale),
      }));
  const groupTitleById = new Map(groupDefinitions.map((group) => [group.id, group.title]));
  const catalogSlots = useCmsCatalog
    ? buildCmsCatalogSlots(cmsProducts, groupDefinitions)
    : buildCatalogSlots(cmsProducts);
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
        .sort((left, right) => sortCatalogSlots(left, right, useCmsCatalog));

      if (groupSlots.length === 0) {
        return null;
      }

      const categoryTitles = useCmsCatalog
        ? []
        : categoryDefinitions
            .filter((category) => category.groupId === group.id)
            .map((category) => category.title);
      const categorySummary =
        catalogSummary(
          categoryTitles.length > 0
            ? categoryTitles
            : groupSlots.map((slot) => localized(slot.title, locale)),
        ) ||
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
  const catalogHashTargets = useCmsCatalog
    ? buildDynamicHashTargets(cmsProductGroups)
    : getCatalogHashTargets();

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
