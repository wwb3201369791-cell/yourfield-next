import type { CtaBandProps } from '@/components/public/CtaBand';
import type { Locale } from '@/lib/i18n/locale';
import { localizedPath } from '@/lib/seo/buildMetadata';

type SiteCtaMessageKey =
  | 'site.cta.primary'
  | 'site.cta.secondary'
  | 'site.cta.text'
  | 'site.cta.title';

type Translate = (key: SiteCtaMessageKey) => string;

export function buildSiteCta(locale: Locale, t: Translate): CtaBandProps {
  return {
    primaryHref: localizedPath(locale, '/contact'),
    primaryLabel: t('site.cta.primary'),
    secondaryHref: localizedPath(locale, '/products'),
    secondaryLabel: t('site.cta.secondary'),
    text: t('site.cta.text'),
    title: t('site.cta.title'),
  };
}
