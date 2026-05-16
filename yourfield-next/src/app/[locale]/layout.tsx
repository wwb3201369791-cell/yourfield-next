import type { ReactNode } from 'react';

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function LocaleLayout({ children }: LocaleLayoutProps) {
  return children;
}
