import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@/components/ui/icons';

type HeroAction = Readonly<{
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}>;

type PageHeroProps = Readonly<{
  title: string;
  eyebrow?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  actions?: readonly HeroAction[];
  priority?: boolean;
}>;

export function PageHero({
  title,
  eyebrow,
  description,
  image,
  imageAlt = '',
  actions = [],
  priority = false,
}: PageHeroProps) {
  return (
    <section className="page-hero">
      {image ? (
        <Image
          className="page-hero__image"
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          priority={priority}
        />
      ) : null}
      <div className="container page-hero__inner">
        <div className="page-hero__copy">
          {eyebrow ? <p className="page-hero__eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p className="page-hero__description">{description}</p> : null}
          {actions.length > 0 ? (
            <div className="page-hero__actions">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  className={[
                    'btn',
                    action.variant === 'secondary' ? 'btn-outline' : 'btn-primary',
                    'gap-2',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  href={action.href}
                >
                  {action.label}
                  <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
