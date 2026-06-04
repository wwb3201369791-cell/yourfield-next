import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

describe('ContactPage CMS-only contact surfaces', () => {
  it('does not render static contact or hero-image fallbacks when CMS fields are empty', async () => {
    vi.doMock('next/link', () => ({
      default: ({
        children,
        href,
        className,
      }: {
        children: ReactNode;
        className?: string;
        href: string;
      }) => (
        <a className={className} href={href}>
          {children}
        </a>
      ),
    }));
    vi.doMock('@/components/forms/LeadSubmitForm', () => ({
      LeadSubmitForm: ({ supportEmail }: { supportEmail?: string }) => (
        <div data-testid="lead-form" data-support-email={supportEmail ?? ''} />
      ),
    }));
    vi.doMock('@/components/public/JsonLd', () => ({ JsonLd: () => null }));
    vi.doMock('@/components/ui/Map', () => ({ CompanyMap: () => <div data-testid="map" /> }));
    vi.doMock('@/lib/cms/pages', () => ({
      getCmsPageByKey: vi.fn(() =>
        Promise.resolve({
          heroEnabled: true,
          slug: 'contact',
          title: '',
        }),
      ),
    }));
    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductBySlug: vi.fn(() => Promise.resolve(null)),
    }));
    vi.doMock('@/lib/cms/site-settings', () => ({
      getCmsSiteSettings: vi.fn(() =>
        Promise.resolve({
          analytics: { enabled: false },
          contact: {
            address: '',
            email: '',
            emailHref: '',
            phone: '',
            phoneHref: '',
          },
          coordinates: { lat: 0, lng: 0, zoom: 1 },
          cookieConsent: { enabled: false },
          icp: '',
          logoDark: null,
          logoLight: null,
          mapService: 'amap',
          seoVerification: {},
          siteName: '',
          tagline: '',
          themeColor: '#1e3a5f',
        }),
      ),
    }));
    vi.doMock('@/lib/env', () => ({
      env: {
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
      },
    }));
    vi.doMock('@/lib/i18n/getTranslations', () => ({
      getTranslations: vi.fn(() =>
        Promise.resolve((key: string) => {
          const messages: Record<string, string> = {
            'nav.home': '首页',
            'page.contact.addressLabel': '地址',
            'page.contact.addressValue': 'STATIC_ADDRESS_SHOULD_NOT_RENDER',
            'page.contact.companyLabel': '公司',
            'page.contact.companyPlaceholder': '公司',
            'page.contact.countryLabel': '国家',
            'page.contact.countryPlaceholder': '国家',
            'page.contact.emailFieldLabel': '邮箱',
            'page.contact.emailLabel': '邮箱',
            'page.contact.emailPlaceholder': '邮箱',
            'page.contact.emailValue': 'static@example.com',
            'page.contact.formIntro': '表单说明',
            'page.contact.formTitle': '表单标题',
            'page.contact.hotlineLabel': '电话',
            'page.contact.hotlineValue': 'STATIC_PHONE_SHOULD_NOT_RENDER',
            'page.contact.introText': 'STATIC_INTRO_SHOULD_NOT_RENDER',
            'page.contact.mapFrameTitle': '地图',
            'page.contact.mapPanelText': '地图说明',
            'page.contact.mapPanelTitle': '地图标题',
            'page.contact.mapPlaceholder': '地图占位',
            'page.contact.mapTag': '地图',
            'page.contact.mapTitle': '地图标题',
            'page.contact.messageLabel': '留言',
            'page.contact.messagePlaceholder': '留言',
            'page.contact.mobileLabel': '电话',
            'page.contact.mobilePlaceholder': '电话',
            'page.contact.nameLabel': '姓名',
            'page.contact.namePlaceholder': '姓名',
            'page.contact.openMap': '打开地图',
            'page.contact.submit': '提交',
            'page.contact.title': '联系我们',
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
    vi.doMock('@/lib/product/types', () => ({ localized: vi.fn(() => '') }));
    vi.doMock('@/lib/seo/buildMetadata', () => ({
      buildPageMetadata: vi.fn(() => ({})),
      localizedPath: vi.fn((locale: string, path: string) =>
        path === '/' ? `/${locale}` : `/${locale}${path}`,
      ),
    }));
    vi.doMock('@/lib/seo/jsonld', () => ({
      breadcrumbJsonLd: vi.fn(() => ({})),
      contactPageJsonLd: vi.fn(() => ({})),
    }));

    const { default: ContactPage } = await import('@/app/(site)/[locale]/(public)/contact/page');
    const element = await ContactPage({
      params: Promise.resolve({ locale: 'zh' }),
      searchParams: Promise.resolve({}),
    });
    const hero = findElement(element, (candidate) =>
      String(candidate.props.className ?? '').includes('contact-page-header'),
    );
    const html = renderToStaticMarkup(element);

    expect(hero?.props.style).toBeUndefined();
    expect(html).not.toContain('STATIC_ADDRESS_SHOULD_NOT_RENDER');
    expect(html).not.toContain('STATIC_PHONE_SHOULD_NOT_RENDER');
    expect(html).not.toContain('static@example.com');
    expect(html).not.toContain('STATIC_INTRO_SHOULD_NOT_RENDER');
    expect(html).toContain('data-support-email=""');
  });
});
