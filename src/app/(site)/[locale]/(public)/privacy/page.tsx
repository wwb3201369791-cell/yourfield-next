import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';

import { CompliancePage, generateComplianceMetadata } from '../compliance-page';

type PrivacyPageProps = Readonly<{
  params: LocaleRouteParams;
}>;

export async function generateMetadata({ params }: PrivacyPageProps) {
  return generateComplianceMetadata({
    locale: await resolveRouteLocaleFromParams(params),
    pageKey: 'privacy',
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  return <CompliancePage locale={await resolveRouteLocaleFromParams(params)} pageKey="privacy" />;
}
