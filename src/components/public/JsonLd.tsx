import { headers } from 'next/headers';

import { CSP_NONCE_HEADER } from '@/lib/security/csp';

type JsonLdProps = Readonly<{
  data: unknown;
}>;

export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
