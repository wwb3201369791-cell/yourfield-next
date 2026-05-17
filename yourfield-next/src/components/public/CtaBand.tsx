import Link from 'next/link';

import { ArrowRightIcon } from '@/components/ui/icons';

type CtaBandProps = Readonly<{
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
    <section className="bg-primary py-16 text-white md:py-20">
      <div className="container flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{title}</h2>
          <p className="text-white/78 mt-4 text-base leading-8 md:text-lg">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary gap-2" href={primaryHref}>
            {primaryLabel}
            <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link className="btn btn-outline" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
