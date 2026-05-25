import { describe, expect, it } from 'vitest';

import {
  createCookieNoticeState,
  cookieNoticeMaxAgeMs,
  cookieNoticeStorageKey,
  cookieNoticeVersion,
  cookieConsentStorageKey,
  hasAnalyticsConsent,
  parseCookieNoticeState,
} from '@/lib/compliance/cookieConsent';

describe('cookie notice state', () => {
  it('uses the notice localStorage key and stores a 12-month acknowledgement window', () => {
    const now = Date.UTC(2026, 4, 18, 0, 0, 0);
    const notice = createCookieNoticeState(now);

    expect(cookieNoticeStorageKey).toBe('yourfield.cookieNotice');
    expect(cookieConsentStorageKey).toBe('yourfield.cookieConsent');
    expect(notice).toMatchObject({
      acknowledgedAt: new Date(now).toISOString(),
      version: cookieNoticeVersion,
    });
    expect(JSON.stringify(notice)).not.toContain('analytics');
    expect(Date.parse(notice.expiresAt) - Date.parse(notice.acknowledgedAt)).toBe(
      cookieNoticeMaxAgeMs,
    );
  });

  it('accepts only unexpired versioned notice records', () => {
    const now = Date.UTC(2026, 4, 18, 0, 0, 0);
    const notice = createCookieNoticeState(now);

    expect(parseCookieNoticeState(JSON.stringify(notice), now)).toEqual(notice);
    expect(
      parseCookieNoticeState(JSON.stringify(notice), now + cookieNoticeMaxAgeMs + 1),
    ).toBeUndefined();
    expect(parseCookieNoticeState(JSON.stringify({ ...notice, version: 0 }), now)).toBeUndefined();
    expect(parseCookieNoticeState('not-json', now)).toBeUndefined();
  });

  it('never grants analytics consent from the notice flow', () => {
    const oldConsent = JSON.stringify({
      analytics: true,
      essential: true,
      expiresAt: new Date(Date.now() + cookieNoticeMaxAgeMs).toISOString(),
      marketing: false,
      savedAt: new Date().toISOString(),
      version: 1,
    });

    expect(hasAnalyticsConsent(oldConsent)).toBe(false);
    expect(hasAnalyticsConsent(undefined)).toBe(false);
  });
});
