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

const normalizeParams = async (params: PayloadAdminPageProps['params']) => ({
  segments: (await params).segments ?? [],
});

export const generateMetadata = ({ params, searchParams }: PayloadAdminPageProps) =>
  generatePageMetadata({ config, params: normalizeParams(params), searchParams });

export default function PayloadAdminPage({ params, searchParams }: PayloadAdminPageProps) {
  return RootPage({ config, importMap, params: normalizeParams(params), searchParams });
}
