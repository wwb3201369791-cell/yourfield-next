import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('@/lib/cms/payload', () => ({
  getPayloadClient: vi.fn(),
}));
const cmsSolutionsMock = vi.hoisted(() => ({
  getCmsSolutions: vi.fn(),
}));
vi.mock('@/lib/cms/solutions', () => ({
  getCmsSolutions: cmsSolutionsMock.getCmsSolutions,
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
  beforeEach(() => {
    vi.mocked(getPayloadClient).mockReset();
    cmsSolutionsMock.getCmsSolutions.mockReset();
    cmsSolutionsMock.getCmsSolutions.mockResolvedValue([]);
  });

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

  it('keeps fallback product navigation aligned with the default product group order', () => {
    const productsItem = getFallbackNavigation(translate).mainNav.find(
      (item) => item.href === '/products',
    );
    const footerProductsGroup = getFallbackNavigation(translate).footerNav.find(
      (group) => group.key === 'products',
    );

    const expectedProductGroupHrefs = [
      '/products#electrical-protection',
      '/products#fire-rescue',
      '/products#thermal-welding',
      '/products#chemical-medical',
      '/products#water-rescue',
    ];

    expect(productsItem?.children?.map((child) => child.href)).toEqual(expectedProductGroupHrefs);
    expect(footerProductsGroup?.links.map((child) => child.href)).toEqual(
      expectedProductGroupHrefs,
    );
    expect(productsItem?.children?.map((child) => child.label)).not.toContain('nav.allProducts');
  });

  it('does not keep static solution children in fallback navigation', () => {
    const fallbackNavigation = getFallbackNavigation(translate);
    const solutionsItem = fallbackNavigation.mainNav.find((item) => item.href === '/solutions');
    const footerSolutionsGroup = fallbackNavigation.footerNav.find(
      (group) => group.key === 'solutions',
    );

    expect(solutionsItem?.children).toBeUndefined();
    expect(footerSolutionsGroup?.links).toEqual([]);
  });

  it('normalizes legacy CMS franchise labels to the current 招商加盟 wording', async () => {
    const legacyFranchiseItem = {
      id: 'franchise',
      label: '招商合作',
      href: '/franchise',
      target: '_self',
    };
    const findGlobal = vi.fn().mockResolvedValue({
      mainNav: [legacyFranchiseItem],
      mobileNav: [legacyFranchiseItem],
      footerNav: [
        {
          id: 'franchise',
          heading: '招商合作',
          items: [legacyFranchiseItem],
        },
      ],
    });

    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal,
      find: vi.fn().mockResolvedValue({ docs: [] }),
    } as never);

    const navigation = await getCmsNavigation('zh');
    const franchiseFooterGroup = navigation.footerNav.find((group) =>
      group.links.some((link) => link.href === '/franchise'),
    );

    expect(navigation.mainNav.find((item) => item.href === '/franchise')?.label).toBe('招商加盟');
    expect(navigation.mobileNav.find((item) => item.href === '/franchise')?.label).toBe('招商加盟');
    expect(franchiseFooterGroup?.label).toBe('招商加盟');
    expect(franchiseFooterGroup?.links.find((link) => link.href === '/franchise')?.label).toBe(
      '招商加盟',
    );
  });

  it('uses backend product group order for product children in header, mobile and footer navigation', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      mainNav: [
        {
          id: 'products',
          label: '产品中心',
          href: '/products',
          target: '_self',
          children: [
            {
              id: 'fire',
              label: '旧导航消防第一',
              href: '/products#fire-rescue',
              target: '_self',
            },
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
    const find = vi.fn(({ collection }) =>
      Promise.resolve({
        docs:
          collection === 'product-groups'
            ? [
                {
                  groupId: 'electrical-protection',
                  name: '电力电弧与电磁防护',
                  order: 1,
                  showOnFrontend: true,
                },
                {
                  groupId: 'fire-rescue',
                  name: '消防与应急救援防护',
                  order: 2,
                  showOnFrontend: true,
                },
                {
                  groupId: 'thermal-welding',
                  name: '热工',
                  order: 3,
                  showOnFrontend: true,
                },
                {
                  groupId: 'chemical-medical',
                  name: '化学',
                  order: 4,
                  showOnFrontend: true,
                },
                {
                  groupId: 'water-rescue',
                  name: '水域',
                  order: 5,
                  showOnFrontend: true,
                },
              ]
            : [],
      }),
    );

    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal,
      find,
    } as never);

    const navigation = await getCmsNavigation('zh');
    const productsItem = navigation.mainNav.find((item) => item.href === '/products');
    const mobileProductsItem = navigation.mobileNav.find((item) => item.href === '/products');
    const footerProductsGroup = navigation.footerNav.find((group) => group.key === 'products');
    const expectedProductGroupHrefs = [
      '/products#electrical-protection',
      '/products#fire-rescue',
      '/products#thermal-welding',
      '/products#chemical-medical',
      '/products#water-rescue',
    ];

    expect(productsItem?.children?.map((child) => child.href)).toEqual(expectedProductGroupHrefs);
    expect(productsItem?.children?.map((child) => child.label)).toEqual([
      '电力电弧与电磁防护',
      '消防与应急救援防护',
      '热工',
      '化学',
      '水域',
    ]);
    expect(mobileProductsItem?.children?.map((child) => child.href)).toEqual(
      expectedProductGroupHrefs,
    );
    expect(footerProductsGroup?.links.map((child) => child.href)).toEqual(
      expectedProductGroupHrefs,
    );
  });

  it('uses published CMS solutions for header, mobile, and footer solution links', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      mainNav: [],
      mobileNav: [],
      footerNav: [],
    });

    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal,
      find: vi.fn().mockResolvedValue({ docs: [] }),
    } as never);
    cmsSolutionsMock.getCmsSolutions.mockResolvedValue([
      { id: 's8', order: 8, title: '方案 8' },
      { id: 's2', order: 2, title: '方案 2' },
      { id: 's1', order: 1, title: '方案 1' },
      { id: 's3', order: 3, title: '方案 3' },
      { id: 's4', order: 4, title: '方案 4' },
      { id: 's5', order: 5, title: '方案 5' },
      { id: 's6', order: 6, title: '方案 6' },
      { id: 's7', order: 7, title: '方案 7' },
    ]);

    const navigation = await getCmsNavigation('zh');
    const solutionsItem = navigation.mainNav.find((item) => item.href === '/solutions');
    const mobileSolutionsItem = navigation.mobileNav.find((item) => item.href === '/solutions');
    const footerSolutionsGroup = navigation.footerNav.find((group) => group.key === 'solutions');

    expect(solutionsItem?.children?.map((child) => child.href)).toEqual([
      '/solutions#s1',
      '/solutions#s2',
      '/solutions#s3',
      '/solutions#s4',
      '/solutions#s5',
      '/solutions#s6',
      '/solutions#s7',
      '/solutions',
    ]);
    expect(solutionsItem?.children?.at(-1)?.label).toBe('nav.allSolutions');
    expect(mobileSolutionsItem?.children?.map((child) => child.href)).toEqual(
      solutionsItem?.children?.map((child) => child.href),
    );
    expect(footerSolutionsGroup?.links.map((link) => link.href)).toEqual(
      solutionsItem?.children?.map((child) => child.href),
    );
  });

  it('keeps dynamic solution links in the footer when CMS footer groups are partial', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      mainNav: [],
      mobileNav: [],
      footerNav: [
        {
          id: 'company',
          heading: '公司',
          items: [
            { id: 'about', label: '关于我们', href: '/about', target: '_self' },
            { id: 'contact', label: '联系我们', href: '/contact', target: '_self' },
          ],
        },
        {
          id: 'products',
          heading: '产品',
          items: [
            { id: 'fire', label: '消防救援', href: '/products#fire-rescue', target: '_self' },
          ],
        },
      ],
    });

    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal,
      find: vi.fn().mockResolvedValue({ docs: [] }),
    } as never);
    cmsSolutionsMock.getCmsSolutions.mockResolvedValue([
      { id: 's2', order: 2, title: '方案 2' },
      { id: 's1', order: 1, title: '方案 1' },
    ]);

    const navigation = await getCmsNavigation('zh');
    const footerSolutionsGroup = navigation.footerNav.find((group) => group.key === 'solutions');

    expect(footerSolutionsGroup?.links.map((link) => link.href)).toEqual([
      '/solutions#s1',
      '/solutions#s2',
    ]);
  });

  it('does not fabricate static solution dropdown entries when CMS has no published solutions', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      mainNav: [],
      mobileNav: [],
      footerNav: [],
    });

    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal,
      find: vi.fn().mockResolvedValue({ docs: [] }),
    } as never);

    const navigation = await getCmsNavigation('zh');
    const solutionsItem = navigation.mainNav.find((item) => item.href === '/solutions');
    const footerSolutionsGroup = navigation.footerNav.find((group) => group.key === 'solutions');

    expect(solutionsItem?.children).toBeUndefined();
    expect(footerSolutionsGroup?.links).toEqual([]);
  });
});
