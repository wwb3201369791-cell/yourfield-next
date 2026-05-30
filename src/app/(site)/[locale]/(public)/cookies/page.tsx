import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';

import { CompliancePage, generateComplianceMetadata } from '../compliance-page';

type CookiesPageProps = Readonly<{
  params: LocaleRouteParams;
}>;

export async function generateMetadata({ params }: CookiesPageProps) {
  return generateComplianceMetadata({
    locale: await resolveRouteLocaleFromParams(params),
    pageKey: 'cookies',
  });
}

export default async function CookiesPage({ params }: CookiesPageProps) {
  return <CompliancePage locale={await resolveRouteLocaleFromParams(params)} pageKey="cookies" />;
}
