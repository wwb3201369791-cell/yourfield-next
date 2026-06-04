import { beforeEach, describe, expect, it, vi } from 'vitest';

function mockStaleUnstableCache() {
  const store = new Map<string, unknown>();

  vi.doMock('react', () => ({
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  }));
  vi.doMock('next/cache', () => ({
    unstable_cache:
      <T extends (...args: never[]) => Promise<unknown>>(fn: T, keyParts: readonly string[]) =>
      async (...args: Parameters<T>) => {
        const key = JSON.stringify([keyParts, args]);
        if (!store.has(key)) {
          store.set(key, await fn(...args));
        }
        return store.get(key);
      },
  }));
}

describe('CMS dev cache bypass for live admin CRUD QA', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('reloads product groups in development instead of serving stale cached taxonomy', async () => {
    mockStaleUnstableCache();
    vi.doMock('@/lib/env', () => ({
      env: {
        NODE_ENV: 'development',
        REVALIDATE_SECRET: '',
      },
    }));

    let productGroupDocs = [
      {
        groupId: 'qa-group-one',
        name: 'QA 大类一',
        order: 1,
        showOnFrontend: true,
      },
    ];
    const find = vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'product-groups') {
        return { docs: productGroupDocs };
      }

      return { docs: [] };
    });

    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(async () => ({ find })),
    }));

    const { getCmsProductGroups } = await import('@/lib/cms/products/groups');

    expect((await getCmsProductGroups('zh')).map((group) => group.id)).toEqual(['qa-group-one']);

    productGroupDocs = [
      {
        groupId: 'qa-group-two',
        name: 'QA 大类二',
        order: 1,
        showOnFrontend: true,
      },
    ];

    expect((await getCmsProductGroups('zh')).map((group) => group.id)).toEqual(['qa-group-two']);
  });

  it('reloads solution navigation in development so header and footer reflect admin CRUD immediately', async () => {
    mockStaleUnstableCache();
    vi.doMock('@/lib/env', () => ({
      env: {
        NODE_ENV: 'development',
        REVALIDATE_SECRET: '',
      },
    }));
    vi.doMock('@/lib/i18n/getTranslations', () => ({
      getTranslations: () => Promise.resolve((key: string) => key),
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(async () => ({
        find: vi.fn(async () => ({ docs: [] })),
        findGlobal: vi.fn(async () => ({
          mainNav: [{ id: 'solutions', label: '解决方案', href: '/solutions', target: '_self' }],
          mobileNav: [
            { id: 'solutions-mobile', label: '解决方案', href: '/solutions', target: '_self' },
          ],
          footerNav: [
            {
              id: 'solutions',
              heading: '解决方案',
              items: [{ id: 'solutions', label: '解决方案', href: '/solutions', target: '_self' }],
            },
          ],
        })),
      })),
    }));

    let solutions = [{ id: 'qa-solution-one', order: 1, title: 'QA 方案一' }];
    vi.doMock('@/lib/cms/solutions', () => ({
      getCmsSolutions: vi.fn(async () => solutions),
    }));

    const { getCmsNavigation } = await import('@/lib/cms/navigation');

    const firstNavigation = await getCmsNavigation('zh');
    expect(
      firstNavigation.mainNav
        .find((item) => item.href === '/solutions')
        ?.children?.map((child) => child.label),
    ).toContain('QA 方案一');

    solutions = [{ id: 'qa-solution-two', order: 1, title: 'QA 方案二' }];

    const secondNavigation = await getCmsNavigation('zh');
    const secondSolutionLabels = secondNavigation.mainNav
      .find((item) => item.href === '/solutions')
      ?.children?.map((child) => child.label);

    expect(secondSolutionLabels).toContain('QA 方案二');
    expect(secondSolutionLabels).not.toContain('QA 方案一');
  });
});
