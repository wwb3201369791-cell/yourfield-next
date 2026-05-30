type SectionHeadingProps = Readonly<{
  heading: string;
  tagLabel: string;
}>;

export function ProductSectionHeading({ heading, tagLabel }: SectionHeadingProps) {
  return (
    <div className="detail-section-heading">
      <span className="section-tag">{tagLabel}</span>
      <h2>{heading}</h2>
    </div>
  );
}
