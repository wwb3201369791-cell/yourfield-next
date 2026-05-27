import { ProductSectionHeading } from './ProductSectionHeading';
import type { CareProps } from './types';

export function ProductCareInstructions({ heading, instructions, tagLabel }: CareProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
      <ul className="detail-check-list">
        {instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ul>
    </>
  );
}
