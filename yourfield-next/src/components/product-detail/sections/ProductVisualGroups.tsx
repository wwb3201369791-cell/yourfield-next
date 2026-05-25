import { ProductDetailVisualCarousel } from '@/components/product/ProductDetailVisualCarousel';

import type { VisualGroupsProps } from './types';

export function ProductVisualGroups({
  carouselNextLabel,
  carouselPreviousLabel,
  groups,
  heading,
  tagLabel,
}: VisualGroupsProps) {
  return (
    <>
      <div className="detail-section-heading">
        <span className="section-tag">{tagLabel}</span>
        <h2>{heading}</h2>
      </div>
      <div className="detail-visual-groups">
        {groups.map((group) => (
          <ProductDetailVisualCarousel
            key={`${group.variant}-${group.title}`}
            description={group.description}
            images={group.images}
            nextLabel={carouselNextLabel}
            previousLabel={carouselPreviousLabel}
            title={group.title}
            variant={group.variant}
          />
        ))}
      </div>
    </>
  );
}
