import { describe, expect, it, vi } from 'vitest';

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}));

vi.mock('@/app/(payload)/admin/importMap.js', () => ({
  importMap: {},
}));

vi.mock('@payloadcms/next/views', () => ({
  generatePageMetadata: vi.fn(async () => ({ title: 'Payload Admin' })),
  RootPage: vi.fn(async () => <main>Payload Admin</main>),
}));

describe('Next route for Payload admin', () => {
  it('preserves the admin root as the dashboard route instead of /admin/', async () => {
    const views = await import('@payloadcms/next/views');
    const { default: PayloadAdminPage, generateMetadata } =
      await import('@/app/(payload)/admin/[[...segments]]/page');
    const props = {
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    };

    await generateMetadata(props);
    await PayloadAdminPage(props);

    const generatePageMetadataMock = vi.mocked(views.generatePageMetadata);
    const rootPageMock = vi.mocked(views.RootPage);

    expect(generatePageMetadataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.any(Promise),
      }),
    );
    await expect(generatePageMetadataMock.mock.calls[0]?.[0].params).resolves.toEqual({});
    await expect(rootPageMock.mock.calls[0]?.[0].params).resolves.toEqual({});
  });

  it('keeps the authenticated admin route dynamic instead of serving a stale 404 shell', async () => {
    const adminRoute = await import('@/app/(payload)/admin/[[...segments]]/page');

    expect(adminRoute.dynamic).toBe('force-dynamic');
  });
});
