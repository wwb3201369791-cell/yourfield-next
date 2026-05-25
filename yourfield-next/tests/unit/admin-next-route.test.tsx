import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PayloadAdminFallbackPage, { metadata } from '@/app/admin/[[...segments]]/page';

describe('Next fallback route for Payload admin', () => {
  it('renders startup guidance instead of letting /admin fall through to the public locale route', () => {
    const html = renderToStaticMarkup(<PayloadAdminFallbackPage />);

    expect(html).toContain('Payload 后台');
    expect(html).toContain('pnpm dev');
    expect(html).toContain('/admin/');
    expect(metadata.robots).toMatchObject({ follow: false, index: false });
  });
});
