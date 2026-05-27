import type { ScenariosProps } from './types';

export function ProductScenarios({ heading, scenarios }: ScenariosProps) {
  return (
    <>
      <div className="detail-section-heading">
        <h2>{heading}</h2>
      </div>
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
