import { resolveRouteLocale } from '@/lib/i18n/route';

import { CompliancePage, generateComplianceMetadata } from '../compliance-page';

type CookiesPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export async function generateMetadata({ params }: CookiesPageProps) {
  return generateComplianceMetadata({
    locale: resolveRouteLocale(params.locale),
    pageKey: 'cookies',
  });
}

export default function CookiesPage({ params }: CookiesPageProps) {
  return <CompliancePage locale={resolveRouteLocale(params.locale)} pageKey="cookies" />;
}
