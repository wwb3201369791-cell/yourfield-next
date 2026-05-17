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
    <section className="relative isolate overflow-hidden bg-primary text-white">
      {image ? (
        <Image
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          priority={priority}
        />
      ) : null}
      <div className="via-primary/88 to-primary/55 absolute inset-0 -z-10 bg-gradient-to-r from-primary-dark" />
      <div className="container flex min-h-[360px] flex-col justify-center py-20 md:min-h-[440px] md:py-24">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] !text-white">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance text-4xl font-bold leading-tight text-white md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-lg leading-8 !text-white md:text-xl">{description}</p>
          ) : null}
          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
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
