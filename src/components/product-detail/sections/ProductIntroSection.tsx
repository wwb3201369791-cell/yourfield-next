import { ProductSectionHeading } from './ProductSectionHeading';
import type { IntroSectionProps } from './types';

export function ProductIntroSection({
  applications,
  applicationsLabel,
  description,
  features,
  featuresLabel,
  heading,
  materials,
  materialsLabel,
  overviewLabel,
  tagLabel,
}: IntroSectionProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
      <div className="detail-intro-grid">
        {description ? (
          <article className="detail-intro-copy">
            <h3>{overviewLabel}</h3>
            <p>{description}</p>
          </article>
        ) : null}
        {materials.length > 0 ? (
          <article className="detail-intro-copy">
            <h3>{materialsLabel}</h3>
            <ul>
              {materials.slice(0, 5).map((material) => (
                <li key={material}>{material}</li>
              ))}
            </ul>
          </article>
        ) : null}
        {features.length > 0 ? (
          <article className="detail-intro-copy">
            <h3>{featuresLabel}</h3>
            <ul>
              {features.slice(0, 7).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        ) : null}
        {applications.length > 0 ? (
          <article className="detail-intro-copy">
            <h3>{applicationsLabel}</h3>
            <ul>
              {applications.slice(0, 5).map((application) => (
                <li key={application}>{application}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </>
  );
}
