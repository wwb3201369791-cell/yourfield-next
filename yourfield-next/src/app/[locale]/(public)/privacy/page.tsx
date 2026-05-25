import { resolveRouteLocale } from '@/lib/i18n/route';

import { CompliancePage, generateComplianceMetadata } from '../compliance-page';

type PrivacyPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export async function generateMetadata({ params }: PrivacyPageProps) {
  return generateComplianceMetadata({
    locale: resolveRouteLocale(params.locale),
    pageKey: 'privacy',
  });
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  return <CompliancePage locale={resolveRouteLocale(params.locale)} pageKey="privacy" />;
}
