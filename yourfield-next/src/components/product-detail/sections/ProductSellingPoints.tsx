import type { SellingPointsProps } from './types';
import { ProductSectionHeading } from './ProductSectionHeading';

export function ProductSellingPoints({ heading, points, tagLabel }: SellingPointsProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
      <div className="detail-point-grid">
        {points.map((point) => (
          <article key={point.title} className="detail-point">
            <h3>{point.title}</h3>
            {point.text ? <p>{point.text}</p> : null}
          </article>
        ))}
      </div>
    </>
  );
}
