import type { ReactNode } from 'react';

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
