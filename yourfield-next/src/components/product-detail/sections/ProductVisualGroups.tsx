import { ProductDetailVisualCarousel } from '@/components/product/ProductDetailVisualCarousel';

import { ProductSectionHeading } from './ProductSectionHeading';
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
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
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
