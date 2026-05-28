import { ProductSectionHeading } from './ProductSectionHeading';
import type { ScenariosProps } from './types';

export function ProductScenarios({ heading, scenarios, tagLabel }: ScenariosProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
      <div className="detail-scenario-grid">
        {scenarios.map((scenario) => (
          <article key={scenario.title} className="detail-scenario">
            <h3>{scenario.title}</h3>
            {scenario.text ? <p>{scenario.text}</p> : null}
          </article>
        ))}
      </div>
    </>
  );
}
