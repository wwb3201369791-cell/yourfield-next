import Image from 'next/image';
import Link from 'next/link';

import { shouldUseUnoptimizedImage } from '@/lib/cms/media';

import type { HeroSectionProps } from './types';

export function ProductHeroCard({
  ctaAllProductsLabel,
  ctaQuoteLabel,
  facts,
  galleryLabel,
  locale,
  mainImage,
  productCategory,
  productCategoryFallbackLabel,
  productDescription,
  productId,
  productTitle,
}: HeroSectionProps) {
  return (
    <article className="detail-hero-card">
      <div className="detail-gallery" aria-label={galleryLabel}>
        <div className="detail-main-image">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={productTitle || productCategory || productId}
              fill
              priority
              sizes="(min-width: 1180px) 36vw, 100vw"
              unoptimized={shouldUseUnoptimizedImage(mainImage)}
            />
          ) : (
            <span className="product-image-empty product-image-empty--detail">
              {productCategory ? <strong>{productCategory}</strong> : null}
              {productTitle ? <span>{productTitle}</span> : null}
            </span>
          )}
        </div>
      </div>

      <div className="detail-summary">
        <span className="section-tag">{productCategory || productCategoryFallbackLabel}</span>
        {productTitle ? <h1>{productTitle}</h1> : null}
        {productDescription ? <p className="detail-description">{productDescription}</p> : null}
        {facts.length > 0 ? (
          <dl className="detail-fact-list">
            {facts.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="detail-actions">
          <Link className="btn btn-primary btn-large" href={`/${locale}/contact?product=${productId}`}>
            {ctaQuoteLabel}
          </Link>
          <Link className="btn btn-secondary btn-large" href={`/${locale}/products`}>
            {ctaAllProductsLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
