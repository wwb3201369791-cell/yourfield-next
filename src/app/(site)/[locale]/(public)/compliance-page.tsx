import Link from 'next/link';

import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { legalPageConfigByKey, type LegalPageKey } from '@/lib/compliance/legalPages';
import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';

type CompliancePageProps = Readonly<{
  locale: Locale;
  pageKey: LegalPageKey;
}>;

export async function generateComplianceMetadata({ locale, pageKey }: CompliancePageProps) {
  const t = await getTranslations(locale);
  const config = legalPageConfigByKey[pageKey];
  const isDraft = await isDraftModeEnabled();
  const page = await getCmsPageByKey(locale, pageKey, isDraft);

  return buildPageMetadata({
    locale,
    path: config.path,
    title: page?.seoTitle || page?.title || t(`page.compliance.${pageKey}.title`),
    description:
      page?.seoDescription || page?.heroSubtitle || t(`page.compliance.${pageKey}.intro`),
    image: page?.seoImage || page?.heroImage,
    canonical: page?.seoCanonical,
    keywords: page?.seoKeywords,
    noIndex: true,
  });
}

export async function CompliancePage({ locale, pageKey }: CompliancePageProps) {
  const t = await getTranslations(locale);
  const config = legalPageConfigByKey[pageKey];

  if (pageKey === 'cookies') {
    return (
      <>
        <PageHero
          title={t('page.compliance.cookies.title')}
          description={t('page.compliance.cookies.intro')}
          imageAlt={t('page.compliance.cookies.title')}
        />

        <section className="bg-white py-16 md:py-24">
          <div className="container max-w-5xl">
            <SectionIntro
              align="left"
              eyebrow={t('page.compliance.cookies.eyebrow')}
              title={t('page.compliance.cookies.summaryTitle')}
              text={t('page.compliance.cookies.summaryText')}
            />

            <div className="grid gap-5">
              {config.sections.map((section) => (
                <article key={section.titleKey} className="rounded border border-border p-6">
                  <h2 className="text-xl font-bold text-primary">{t(section.titleKey)}</h2>
                  <p className="mt-3 text-sm leading-7 text-text-light">{t(section.textKey)}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded border border-border bg-bg-light p-6">
              <h2 className="text-xl font-bold text-primary">
                {t('page.compliance.cookies.contactTitle')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-text-light">
                {t('page.compliance.cookies.contactText')}
              </p>
              <Link className="btn btn-primary mt-5" href={localizedPath(locale, '/contact')}>
                {t('page.compliance.cookies.contactCta')}
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        title={t(`page.compliance.${pageKey}.title`)}
        description={t(`page.compliance.${pageKey}.intro`)}
        imageAlt={t(`page.compliance.${pageKey}.title`)}
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="h-fit rounded border border-border bg-bg-light p-6">
            <p className="section-tag">{t('page.compliance.statusTag')}</p>
            <h2 className="mt-3 text-2xl font-bold text-primary">
              {t('page.compliance.statusTitle')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-light">
              {t('page.compliance.statusText')}
            </p>
            <dl className="mt-6 grid gap-4 text-sm">
              <div>
                <dt className="font-bold text-primary">{t('page.compliance.finalCopyLabel')}</dt>
                <dd className="mt-1 text-text-light">{t('page.compliance.finalCopyStatus')}</dd>
              </div>
              <div>
                <dt className="font-bold text-primary">{t('page.compliance.icpLabel')}</dt>
                <dd className="mt-1 text-text-light">{t('page.compliance.icpStatus')}</dd>
              </div>
              <div>
                <dt className="font-bold text-primary">{t('page.compliance.policeLabel')}</dt>
                <dd className="mt-1 text-text-light">{t('page.compliance.policeStatus')}</dd>
              </div>
            </dl>
          </aside>

          <div>
            <SectionIntro
              align="left"
              eyebrow={t('page.compliance.eyebrow')}
              title={t(`page.compliance.${pageKey}.summaryTitle`)}
              text={t(`page.compliance.${pageKey}.summaryText`)}
            />
            <div className="grid gap-5">
              {config.sections.map((section) => (
                <article key={section.titleKey} className="rounded border border-border p-6">
                  <h3 className="text-xl font-bold text-primary">{t(section.titleKey)}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-light">{t(section.textKey)}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 rounded border border-border bg-bg-light p-6">
              <h3 className="text-xl font-bold text-primary">
                {t('page.compliance.contactTitle')}
              </h3>
              <p className="mt-3 text-sm leading-7 text-text-light">
                {t('page.compliance.contactText')}
              </p>
              <Link className="btn btn-primary mt-5" href={localizedPath(locale, '/contact')}>
                {t('page.compliance.contactCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
