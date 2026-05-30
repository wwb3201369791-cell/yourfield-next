import { GRAPHQL_POST } from '@payloadcms/next/routes';

import config from '@/payload.config';

export const dynamic = 'force-dynamic';

export const POST = GRAPHQL_POST(config);
