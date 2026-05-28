import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { createRobotsRules, siteHost } from '@/lib/seo/assets';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: createRobotsRules(),
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
    host: siteHost(),
  };
}
