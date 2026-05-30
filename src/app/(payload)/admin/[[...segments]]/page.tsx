import { RootPage, generatePageMetadata } from '@payloadcms/next/views';

import config from '@/payload.config';

import { importMap } from '../importMap.js';

export const dynamic = 'force-dynamic';

type PayloadAdminPageProps = Readonly<{
  params: Promise<{
    segments?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[]>>;
}>;

type PayloadAdminRouteParams = { segments: string[] };

const normalizeParams = async (
  params: PayloadAdminPageProps['params'],
): Promise<PayloadAdminRouteParams> => {
  const resolvedParams = await params;
  const segments = Array.isArray(resolvedParams.segments) ? resolvedParams.segments : undefined;

  // Payload's RootPage treats a non-array segments value as the exact admin root.
  // Returning `[]` here formats the route as `/admin/`, which misses the dashboard view.
  return (segments && segments.length > 0 ? { segments } : {}) as PayloadAdminRouteParams;
};

export const generateMetadata = ({ params, searchParams }: PayloadAdminPageProps) =>
  generatePageMetadata({ config, params: normalizeParams(params), searchParams });

export default function PayloadAdminPage({ params, searchParams }: PayloadAdminPageProps) {
  return RootPage({ config, importMap, params: normalizeParams(params), searchParams });
}
