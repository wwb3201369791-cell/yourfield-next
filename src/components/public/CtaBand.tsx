import Link from 'next/link';

export type CtaBandProps = Readonly<{
  title: string;
  text: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}>;

export function CtaBand({
  title,
  text,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: CtaBandProps) {
  return (
    <section className="site-cta">
      <div className="container">
        <div className="site-cta__content">
          <h2>{title}</h2>
          <p>{text}</p>
          <div className="site-cta__actions">
            <Link className="btn btn-primary btn-large" href={primaryHref}>
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link className="btn btn-outline btn-large" href={secondaryHref}>
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
