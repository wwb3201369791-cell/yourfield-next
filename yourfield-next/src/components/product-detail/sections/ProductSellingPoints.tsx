import type { SellingPointsProps } from './types';

export function ProductSellingPoints({ heading, points, tagLabel }: SellingPointsProps) {
  return (
    <>
      <div className="detail-section-heading">
        <span className="section-tag">{tagLabel}</span>
        <h2>{heading}</h2>
      </div>
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
