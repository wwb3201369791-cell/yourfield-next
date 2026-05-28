import { ProductSectionHeading } from './ProductSectionHeading';
import type { QualityEvidenceProps } from './types';

export function ProductQualityEvidence({ heading, items, tagLabel }: QualityEvidenceProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
      <div className="detail-evidence-grid">
        {items.map((item) => (
          <article key={item.title} className="detail-evidence-card">
            {item.status ? <span>{item.status}</span> : null}
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </article>
        ))}
      </div>
    </>
  );
}
