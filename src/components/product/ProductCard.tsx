import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@/components/ui/icons';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import type { Locale } from '@/lib/i18n/locale';
import { localized, type Product } from '@/lib/product/types';

type ProductCardProps = Readonly<{
  product: Product;
  locale: Locale;
  detailLabel: string;
}>;

export function ProductCard({ product, locale, detailLabel }: ProductCardProps) {
  const isCmsMediaImage = shouldUseUnoptimizedImage(product.image);
  const productTitle = localized(product.name, locale);
  const productCategory = localized(product.categoryName, locale);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded border border-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        className="relative block aspect-[4/3] bg-bg-light"
        href={`/${locale}/products/${product.id}`}
        aria-label={`${detailLabel}: ${productTitle}`}
      >
        {product.image ? (
          <Image
            className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-105"
            src={product.image}
            alt={productTitle}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={isCmsMediaImage}
          />
        ) : (
          <span className="product-image-empty product-image-empty--card" aria-label={productTitle}>
            <strong>{productCategory}</strong>
            <span>{productTitle}</span>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
          {productCategory}
        </p>
        <h3 className="mt-3 text-xl font-bold text-primary">{productTitle}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-light">
          {localized(product.description, locale)}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {product.standards.slice(0, 2).map((standard) => (
            <span
              key={standard}
              className="border-primary/15 bg-primary/5 rounded-full border px-3 py-1 text-xs font-semibold text-primary"
            >
              {standard}
            </span>
          ))}
        </div>
        <Link
          className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-primary hover:text-accent"
          href={`/${locale}/products/${product.id}`}
        >
          {detailLabel}
          <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
        </Link>
      </div>
    </article>
  );
}
