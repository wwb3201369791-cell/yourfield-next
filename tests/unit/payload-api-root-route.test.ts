import { afterEach, describe, expect, it, vi } from 'vitest';

type PayloadRestArgs = {
  params: Promise<{
    slug?: string[];
  }>;
};

type PayloadRestHandler = (request: Request, args: PayloadRestArgs) => Promise<Response>;

type RouteFactory = (config: unknown) => PayloadRestHandler;

const createRouteFactory = (capturedParams: Array<{ slug?: string[] }>): RouteFactory => {
  return () => async (_request, args) => {
    capturedParams.push(await args.params);

    return new Response(null, { status: 200 });
  };
};

afterEach(() => {
  vi.doUnmock('@payloadcms/next/routes');
  vi.doUnmock('@/payload.config');
  vi.resetModules();
});

describe('Payload REST API route wrapper', () => {
  it('normalizes an empty optional catch-all slug before delegating to Payload routes', async () => {
    const capturedParams: Array<{ slug?: string[] }> = [];
    const routeFactory = createRouteFactory(capturedParams);

    vi.doMock('@payloadcms/next/routes', () => ({
      REST_DELETE: routeFactory,
      REST_GET: routeFactory,
      REST_OPTIONS: routeFactory,
      REST_PATCH: routeFactory,
      REST_POST: routeFactory,
      REST_PUT: routeFactory,
    }));
    vi.doMock('@/payload.config', () => ({ default: {} }));

    const route = await import('@/app/(payload)/payload-api/[[...slug]]/route');
    const request = new Request('http://localhost:3000/payload-api');

    await route.GET(request, { params: Promise.resolve({}) });
    await route.GET(request, { params: Promise.resolve({ slug: ['products'] }) });

    expect(capturedParams).toEqual([{ slug: [] }, { slug: ['products'] }]);
  });
});
