import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement<Record<string, unknown>>) => boolean,
): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node as readonly ReactNode[]) {
      const match = findElement(child, predicate);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  const element = node as ReactElement<Record<string, unknown>>;
  if (predicate(element)) {
    return element;
  }

  return findElement(element.props.children as ReactNode, predicate);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('solutions page hero image', () => {
  it('does not render a static hero fallback when the CMS page has no background image', async () => {
    vi.doMock('next/link', () => ({
      default: ({ children, href }: { children: ReactNode; href: string }) => (
        <a href={href}>{children}</a>
      ),
    }));
    vi.doMock('next/image', () => ({
      default: () => null,
    }));
    vi.doMock('@/components/public/JsonLd', () => ({
      JsonLd: () => null,
    }));
    vi.doMock('@/lib/cms/media', () => ({
      shouldUseUnoptimizedImage: vi.fn(() => false),
    }));
    vi.doMock('@/lib/cms/pages', () => ({
      getCmsPageByKey: vi.fn(() =>
        Promise.resolve({
          heroEnabled: true,
          slug: 'solutions',
          title: '解决方案',
        }),
      ),
    }));
    vi.doMock('@/lib/cms/solutions', () => ({
      getCmsSolutions: vi.fn(() => Promise.resolve([])),
    }));
    vi.doMock('@/lib/content/solutionPage', () => ({
      buildSolutionsPageSections: vi.fn(() => ({ detailCards: [], isEmpty: true })),
    }));
    vi.doMock('@/lib/i18n/getTranslations', () => ({
      getTranslations: vi.fn(() =>
        Promise.resolve((key: string) => {
          const messages: Record<string, string> = {
            'common.viewProducts': '查看产品',
            'nav.home': '首页',
            'page.solutions.introText': '行业解决方案说明',
            'page.solutions.introTitle': '行业解决方案',
            'page.solutions.productsLabel': '相关产品',
            'page.solutions.tag': '行业方案',
            'page.solutions.title': '解决方案',
          };

          return messages[key] ?? key;
        }),
      ),
    }));
    vi.doMock('@/lib/i18n/route', () => ({
      resolveRouteLocaleFromParams: vi.fn(() => Promise.resolve('zh')),
    }));
    vi.doMock('@/lib/preview/draft', () => ({
      isDraftModeEnabled: vi.fn(() => Promise.resolve(false)),
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

    const { default: SolutionsPage } =
      await import('@/app/(site)/[locale]/(public)/solutions/page');
    const element = await SolutionsPage({ params: Promise.resolve({ locale: 'zh' }) });
    const hero = findElement(element, (candidate) =>
      String(candidate.props.className ?? '').includes('solutions-page-header'),
    );

    expect(hero?.props.style).toBeUndefined();
  });
});
