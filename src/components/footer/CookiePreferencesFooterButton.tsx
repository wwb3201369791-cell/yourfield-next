import Link from 'next/link';

type CookiePreferencesFooterButtonProps = Readonly<{
  href: string;
  label: string;
}>;

export function CookiePreferencesFooterButton({ href, label }: CookiePreferencesFooterButtonProps) {
  return (
    <Link
      className="footer-cookie-preferences border-0 bg-transparent p-0 text-left text-inherit underline-offset-4 hover:underline"
      href={href}
    >
      {label}
    </Link>
  );
}
