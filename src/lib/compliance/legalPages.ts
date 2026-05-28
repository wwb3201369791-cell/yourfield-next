export const legalPageKeys = ['privacy', 'cookies', 'terms'] as const;

export type LegalPageKey = (typeof legalPageKeys)[number];

export type LegalPageSection = Readonly<{
  titleKey: string;
  textKey: string;
}>;

export type LegalPageConfig = Readonly<{
  path: `/${LegalPageKey}`;
  sections: readonly LegalPageSection[];
}>;

export const legalPageConfigByKey: Record<LegalPageKey, LegalPageConfig> = {
  privacy: {
    path: '/privacy',
    sections: [
      {
        titleKey: 'page.compliance.privacy.section1Title',
        textKey: 'page.compliance.privacy.section1Text',
      },
      {
        titleKey: 'page.compliance.privacy.section2Title',
        textKey: 'page.compliance.privacy.section2Text',
      },
      {
        titleKey: 'page.compliance.privacy.section3Title',
        textKey: 'page.compliance.privacy.section3Text',
      },
    ],
  },
  cookies: {
    path: '/cookies',
    sections: [
      {
        titleKey: 'page.compliance.cookies.section1Title',
        textKey: 'page.compliance.cookies.section1Text',
      },
      {
        titleKey: 'page.compliance.cookies.section2Title',
        textKey: 'page.compliance.cookies.section2Text',
      },
      {
        titleKey: 'page.compliance.cookies.section3Title',
        textKey: 'page.compliance.cookies.section3Text',
      },
      {
        titleKey: 'page.compliance.cookies.section4Title',
        textKey: 'page.compliance.cookies.section4Text',
      },
    ],
  },
  terms: {
    path: '/terms',
    sections: [
      {
        titleKey: 'page.compliance.terms.section1Title',
        textKey: 'page.compliance.terms.section1Text',
      },
      {
        titleKey: 'page.compliance.terms.section2Title',
        textKey: 'page.compliance.terms.section2Text',
      },
      {
        titleKey: 'page.compliance.terms.section3Title',
        textKey: 'page.compliance.terms.section3Text',
      },
    ],
  },
};
