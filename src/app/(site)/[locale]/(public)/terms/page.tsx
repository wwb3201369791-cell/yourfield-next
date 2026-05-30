import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';

import { CompliancePage, generateComplianceMetadata } from '../compliance-page';

type TermsPageProps = Readonly<{
  params: LocaleRouteParams;
}>;

export async function generateMetadata({ params }: TermsPageProps) {
  return generateComplianceMetadata({
    locale: await resolveRouteLocaleFromParams(params),
    pageKey: 'terms',
  });
}

export default async function TermsPage({ params }: TermsPageProps) {
  return <CompliancePage locale={await resolveRouteLocaleFromParams(params)} pageKey="terms" />;
}
