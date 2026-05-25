import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const localizedText = (value: string) => ({ en: value, ru: value, zh: value });

type ProductCatalogProps = {
  groups: Array<{
    categorySummary: string;
    id: string;
    slots: Array<{
      href: string;
      title: string;
    }>;
    title: string;
  }>;
  overview: {
    stats?: unknown;
  };
};

function findElementByType(
  node: ReactNode,
  type: unknown,
): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByType(child, type);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  if (node.type === type) {
    return node as ReactElement<Record<string, unknown>>;
  }

  const props = node.props as { children?: ReactNode };

  return findElementByType(props.children, type);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('products page dynamic catalog groups', () => {
  it('renders product groups even when no product categories exist', async () => {
    const ProductCatalog = () => null;

    vi.doMock('@/components/product/ProductCatalog', () => ({
      ProductCatalog,
    }));
    vi.doMock('@/components/public/JsonLd', () => ({
      JsonLd: () => null,
    }));
    vi.doMock('next/link', () => ({
      default: ({ children, href }: { children: ReactNode; href: string }) => (
        <a href={href}>{children}</a>
      ),
    }));
    vi.doMock('@/lib/i18n/getTranslations', () => ({
      getTranslations: vi.fn(() =>
        Promise.resolve((key: string) => {
          const messages: Record<string, string> = {
            'common.viewDetails': '查看详情',
            'products.catalog.coverage': '产品目录',
            'products.catalog.currentPublishedText': '产品资料',
            'products.catalog.detailReady': '查看详情',
            'products.catalog.emptyFilterText': '暂无产品',
            'products.catalog.emptyFilterTitle': '暂无产品',
            'products.catalog.filterLabel': '按产品目录筛选',
            'products.catalog.officialTaxonomy': '产品资料',
            'products.catalog.placeholderReady': '资料整理中',
            'products.catalog.railNext': '下一组',
            'products.catalog.railPrevious': '上一组',
            'products.catalog.taxonomyTitle': '产品目录',
            'search.noResults': '无结果',
            'search.noResultsTitle': '无结果',
            'search.results': '搜索结果',
          };

          return messages[key] ?? key;
        }),
      ),
    }));
    vi.doMock('@/lib/i18n/route', () => ({
      resolveRouteLocale: vi.fn(() => 'zh'),
    }));
    vi.doMock('@/lib/preview/draft', () => ({
      isDraftModeEnabled: vi.fn(() => false),
    }));
    vi.doMock('@/lib/seo/buildMetadata', () => ({
      buildPageMetadata: vi.fn(() => ({})),
      localizedPath: vi.fn((locale: string, path: string) =>
        path === '/' ? `/${locale}` : `/${locale}${path}`,
      ),
    }));
    vi.doMock('@/lib/seo/jsonld', () => ({
      breadcrumbJsonLd: vi.fn(() => ({})),
      collectionPageJsonLd: vi.fn(() => ({})),
    }));
    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductCategories: vi.fn(() => Promise.resolve([])),
      getCmsProductGroups: vi.fn(() =>
        Promise.resolve([
          {
            categoryIds: [],
            id: 'chemical-medical',
            order: 0,
            title: '化学与医用防护',
          },
        ]),
      ),
      getCmsProducts: vi.fn(() =>
        Promise.resolve([
          {
            applications: [],
            categoryId: 'chemical-medical',
            categoryName: localizedText('化学与医用防护'),
            description: localizedText('用于危化处置和医疗隔离场景。'),
            faqs: [],
            features: [localizedText('耐酸碱')],
            groupId: 'chemical-medical',
            id: 'chemical-protective-suit',
            image: '/images/products/chemical.png',
            images: ['/images/products/chemical.png'],
            materials: [],
            model: 'YF-CHEM',
            name: localizedText('防化服'),
            specifications: [],
            standards: ['GB 24539'],
          },
        ]),
      ),
    }));

    const { default: ProductsPage } = await import('@/app/[locale]/(public)/products/page');
    const element = await ProductsPage({ params: { locale: 'zh' } });
    const catalogElement = findElementByType(element, ProductCatalog);
    const props = catalogElement?.props as ProductCatalogProps | undefined;

    expect(props?.groups).toHaveLength(1);
    expect(props?.groups[0]).toMatchObject({
      categorySummary: '防化服',
      id: 'chemical-medical',
      title: '化学与医用防护',
    });
    expect(props?.groups[0]?.slots[0]).toMatchObject({
      href: '/zh/products/chemical-protective-suit',
      title: '防化服',
    });
    expect(props?.overview.stats).toBeUndefined();
  });
});
