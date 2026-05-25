import type { ScenariosProps } from './types';

export function ProductScenarios({ heading, scenarios, tagLabel }: ScenariosProps) {
  return (
    <>
      <div className="detail-section-heading">
        <span className="section-tag">{tagLabel}</span>
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
