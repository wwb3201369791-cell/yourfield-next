import type { FaqProps } from './types';

export function ProductFaqList({ entries, heading, tagLabel }: FaqProps) {
  return (
    <>
      <div className="detail-section-heading">
        <span className="section-tag">{tagLabel}</span>
        <h2>{heading}</h2>
      </div>
      <div className="detail-faq-list">
        {entries.map((entry) => (
          <details key={entry.question}>
            <summary>{entry.question}</summary>
            <p>{entry.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
