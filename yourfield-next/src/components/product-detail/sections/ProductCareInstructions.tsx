import type { CareProps } from './types';

export function ProductCareInstructions({ heading, instructions }: CareProps) {
  return (
    <>
      <div className="detail-section-heading">
        <h2>{heading}</h2>
      </div>
      <ul className="detail-check-list">
        {instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ul>
    </>
  );
}
