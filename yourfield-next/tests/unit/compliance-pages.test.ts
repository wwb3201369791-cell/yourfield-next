import { describe, expect, it } from 'vitest';

import { legalPageConfigByKey, legalPageKeys } from '@/lib/compliance/legalPages';

import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';
import zhMessages from '../../messages/zh.json';

const messagesByLocale = {
  en: enMessages,
  ru: ruMessages,
  zh: zhMessages,
} as const;

const sharedComplianceKeys = [
  'page.compliance.eyebrow',
  'page.compliance.statusTag',
  'page.compliance.statusTitle',
  'page.compliance.statusText',
  'page.compliance.finalCopyLabel',
  'page.compliance.finalCopyTodo',
  'page.compliance.icpLabel',
  'page.compliance.icpTodo',
  'page.compliance.policeLabel',
  'page.compliance.policeTodo',
  'page.compliance.contactTitle',
  'page.compliance.contactText',
  'page.compliance.contactCta',
  'cookie.notice.title',
  'cookie.notice.body',
  'cookie.notice.linkLabel',
  'cookie.notice.close',
] as const;

const cookiesPageKeys = [
  'page.compliance.cookies.eyebrow',
  'page.compliance.cookies.contactTitle',
  'page.compliance.cookies.contactText',
  'page.compliance.cookies.contactCta',
] as const;

describe('legal compliance page config', () => {
  it('defines one localized route for each local compliance page', () => {
    expect(legalPageKeys).toEqual(['privacy', 'cookies', 'terms']);

    for (const pageKey of legalPageKeys) {
      expect(legalPageConfigByKey[pageKey].path).toBe(`/${pageKey}`);
    }

    expect(legalPageConfigByKey.privacy.sections).toHaveLength(3);
    expect(legalPageConfigByKey.cookies.sections).toHaveLength(4);
    expect(legalPageConfigByKey.terms.sections).toHaveLength(3);
  });

  it('keeps required placeholder copy available in every locale', () => {
    const requiredKeys = [
      ...sharedComplianceKeys,
      ...cookiesPageKeys,
      ...legalPageKeys.flatMap((pageKey) => [
        `page.compliance.${pageKey}.title`,
        `page.compliance.${pageKey}.intro`,
        `page.compliance.${pageKey}.summaryTitle`,
        `page.compliance.${pageKey}.summaryText`,
        ...legalPageConfigByKey[pageKey].sections.flatMap((section) => [
          section.titleKey,
          section.textKey,
        ]),
      ]),
    ];

    for (const [locale, messages] of Object.entries(messagesByLocale)) {
      for (const key of requiredKeys) {
        expect(messages, `${locale} is missing ${key}`).toHaveProperty(key);
      }
    }
  });
});
