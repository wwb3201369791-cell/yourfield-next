import { resolveRouteLocale } from '@/lib/i18n/route';

import { CompliancePage, generateComplianceMetadata } from '../compliance-page';

type TermsPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export async function generateMetadata({ params }: TermsPageProps) {
  return generateComplianceMetadata({
    locale: resolveRouteLocale(params.locale),
    pageKey: 'terms',
  });
}

export default function TermsPage({ params }: TermsPageProps) {
  return <CompliancePage locale={resolveRouteLocale(params.locale)} pageKey="terms" />;
}
