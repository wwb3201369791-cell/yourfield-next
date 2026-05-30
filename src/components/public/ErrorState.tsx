import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon } from '@/components/ui/icons';

type ErrorAction = Readonly<{
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}>;

type ErrorStateProps = Readonly<{
  eyebrow: string;
  title: string;
  text: string;
  status: string;
  meta?: string;
  actions?: readonly ErrorAction[];
  children?: ReactNode;
}>;

export function ErrorState({
  eyebrow,
  title,
  text,
  status,
  meta,
  actions = [],
  children,
}: ErrorStateProps) {
  return (
    <section className="bg-bg-light py-16 md:py-24">
      <div className="container grid min-h-[calc(100vh-220px)] gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-center">
        <div
          className="flex aspect-[4/3] items-center justify-center rounded border border-border bg-white shadow-sm"
          aria-hidden="true"
        >
          <span className="text-primary/10 text-[clamp(4.75rem,16vw,13rem)] font-bold leading-none">
            {status}
          </span>
        </div>
        <div className="max-w-2xl">
          <p className="section-tag">{eyebrow}</p>
          <h1 className="text-balance text-4xl font-bold text-primary md:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-8 text-text-light md:text-lg">{text}</p>
          {meta ? (
            <p className="mt-4 inline-flex rounded border border-border bg-white px-4 py-2 text-sm font-semibold text-text-light">
              {meta}
            </p>
          ) : null}
          {actions.length > 0 || children ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  className={[
                    'btn',
                    action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary',
                    'gap-2',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  href={action.href}
                >
                  {action.label}
                  {action.variant === 'secondary' ? null : (
                    <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
                  )}
                </Link>
              ))}
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
