import { describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('@/lib/cms/payload', () => ({
  getPayloadClient: vi.fn(),
}));
vi.mock('@/lib/i18n/getTranslations', () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

import { getPayloadClient } from '@/lib/cms/payload';
import {
  getCmsNavigation,
  isSupportedFooterNavigationHref,
  isSupportedMainNavigationHref,
} from '@/lib/cms/navigation';
import { getFallbackNavigation } from '@/lib/navigation';

const translate = (key: string) => key;

describe('legal footer navigation', () => {
  it('allows compliance links in the footer without allowing them in main navigation', () => {
    expect(isSupportedMainNavigationHref('/privacy')).toBe(false);
    expect(isSupportedMainNavigationHref('/cookies')).toBe(false);
    expect(isSupportedMainNavigationHref('/terms')).toBe(false);

    expect(isSupportedFooterNavigationHref('/privacy')).toBe(true);
    expect(isSupportedFooterNavigationHref('/cookies')).toBe(true);
    expect(isSupportedFooterNavigationHref('/terms')).toBe(true);
  });

  it('keeps compliance links discoverable in fallback footer navigation', () => {
    const footerLinks = getFallbackNavigation(translate).footerNav.flatMap((group) =>
      group.links.map((link) => link.href),
    );

    expect(footerLinks).toEqual(expect.arrayContaining(['/privacy', '/cookies', '/terms']));
  });

  it('keeps the main products dropdown as the fixed five public product groups', () => {
    const productsItem = getFallbackNavigation(translate).mainNav.find(
      (item) => item.href === '/products',
    );

    expect(productsItem?.children?.map((child) => child.href)).toEqual([
      '/products#fire-rescue',
      '/products#electrical-protection',
      '/products#thermal-welding',
      '/products#chemical-medical',
      '/products#water-rescue',
    ]);
    expect(productsItem?.children?.map((child) => child.label)).not.toContain('nav.allProducts');
  });

  it('overrides CMS product children so the header does not grow with backend product groups', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      mainNav: [
        {
          id: 'products',
          label: '产品中心',
          href: '/products',
          target: '_self',
          children: [
            { id: 'all', label: '全部产品', href: '/products', target: '_self' },
            {
              id: 'custom',
              label: '后台新增大类',
              href: '/products?group=custom',
              target: '_self',
            },
          ],
        },
      ],
      mobileNav: [],
      footerNav: [],
    });

    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal,
    } as never);

    const navigation = await getCmsNavigation('zh');
    const productsItem = navigation.mainNav.find((item) => item.href === '/products');

    expect(productsItem?.children?.map((child) => child.href)).toEqual([
      '/products#fire-rescue',
      '/products#electrical-protection',
      '/products#thermal-welding',
      '/products#chemical-medical',
      '/products#water-rescue',
    ]);
  });
});
