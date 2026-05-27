import type { QualityEvidenceProps } from './types';

export function ProductQualityEvidence({ heading, items }: QualityEvidenceProps) {
  return (
    <>
      <div className="detail-section-heading">
        <h2>{heading}</h2>
      </div>
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
