import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('CMS page media fallbacks', () => {
  it('does not use static hero/metadata images when editable CMS media is missing', () => {
    expect(source('src/app/(site)/[locale]/(public)/about/page.tsx')).not.toContain(
      "page?.seoImage || page?.heroImage || '/images/about/about-page-hero.png'",
    );
    expect(source('src/app/(site)/[locale]/(public)/about/page.tsx')).not.toContain(
      "page?.heroImage || '/images/about/about-page-hero.png'",
    );
    expect(source('src/app/(site)/[locale]/(public)/franchise/page.tsx')).not.toContain(
      "page?.seoImage || page?.heroImage || '/images/headers/franchise-partnership-hero-full.jpg'",
    );
    expect(source('src/app/(site)/[locale]/(public)/franchise/page.tsx')).not.toContain(
      "page?.heroImage || '/images/headers/franchise-partnership.png'",
    );
    expect(source('src/app/(site)/[locale]/(public)/products/[slug]/page.tsx')).not.toContain(
      "product.image || '/images/headers/products-center.png'",
    );
    expect(source('src/app/(site)/[locale]/(public)/compliance-page.tsx')).not.toContain(
      '/images/headers/contact-us.png',
    );
  });
});
