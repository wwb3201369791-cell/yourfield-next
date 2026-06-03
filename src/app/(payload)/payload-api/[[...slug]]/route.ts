import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes';

import config from '@/payload.config';

export const dynamic = 'force-dynamic';

type PayloadRestArgs = {
  params: Promise<{
    slug?: string[];
  }>;
};

type PayloadRestHandler = (request: Request, args: PayloadRestArgs) => Promise<Response>;

const normalizeRootSlug = (handler: PayloadRestHandler): PayloadRestHandler => {
  return async (request, args) => {
    const params = await args.params;

    return handler(request, {
      params: Promise.resolve({
        ...params,
        slug: params.slug ?? [],
      }),
    });
  };
};

export const GET = normalizeRootSlug(REST_GET(config));
export const POST = normalizeRootSlug(REST_POST(config));
export const DELETE = normalizeRootSlug(REST_DELETE(config));
export const PATCH = normalizeRootSlug(REST_PATCH(config));
export const PUT = normalizeRootSlug(REST_PUT(config));
export const OPTIONS = normalizeRootSlug(REST_OPTIONS(config));
