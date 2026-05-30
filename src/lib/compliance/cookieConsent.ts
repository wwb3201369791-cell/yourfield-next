export const cookieNoticeStorageKey = 'yourfield.cookieNotice';
export const cookieConsentStorageKey = 'yourfield.cookieConsent';
export const cookieNoticeVersion = 2;
export const cookieNoticeMaxAgeMs = 365 * 24 * 60 * 60 * 1000;

export type CookieNoticeChoice = 'accepted' | 'dismissed' | 'rejected';

export type CookieNoticeState = Readonly<{
  acknowledgedAt: string;
  choice: CookieNoticeChoice;
  expiresAt: string;
  version: typeof cookieNoticeVersion;
}>;

const validCookieNoticeChoices = new Set<CookieNoticeChoice>(['accepted', 'dismissed', 'rejected']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidIsoDate(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isFutureIsoDate(value: unknown, now: number) {
  return isValidIsoDate(value) && Date.parse(value as string) > now;
}

export function createCookieNoticeState(
  choice: CookieNoticeChoice = 'dismissed',
  now = Date.now(),
): CookieNoticeState {
  return {
    acknowledgedAt: new Date(now).toISOString(),
    choice,
    expiresAt: new Date(now + cookieNoticeMaxAgeMs).toISOString(),
    version: cookieNoticeVersion,
  };
}

export function parseCookieNoticeState(raw: string | null | undefined, now = Date.now()) {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      !isRecord(parsed) ||
      parsed.version !== cookieNoticeVersion ||
      !validCookieNoticeChoices.has(parsed.choice as CookieNoticeChoice) ||
      !isValidIsoDate(parsed.acknowledgedAt) ||
      !isFutureIsoDate(parsed.expiresAt, now)
    ) {
      return undefined;
    }

    return parsed as CookieNoticeState;
  } catch {
    return undefined;
  }
}

export function hasAnalyticsConsent(_raw: string | null | undefined, _now = Date.now()) {
  return false;
}

export const cookieConsentVersion = cookieNoticeVersion;
export const cookieConsentMaxAgeMs = cookieNoticeMaxAgeMs;
export const createCookieConsentState = createCookieNoticeState;
export const parseCookieConsentState = parseCookieNoticeState;
