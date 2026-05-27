import { ProductSectionHeading } from './ProductSectionHeading';
import type { FaqProps } from './types';

export function ProductFaqList({ entries, heading, tagLabel }: FaqProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
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
