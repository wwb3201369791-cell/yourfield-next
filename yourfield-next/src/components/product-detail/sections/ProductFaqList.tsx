import type { FaqProps } from './types';

export function ProductFaqList({ entries, heading }: FaqProps) {
  return (
    <>
      <div className="detail-section-heading">
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
