// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CookieBanner, type CookieBannerCopy } from '@/components/compliance/CookieBanner';
import { cookieConsentStorageKey, cookieNoticeStorageKey } from '@/lib/compliance/cookieConsent';

const copy: CookieBannerCopy = {
  body:
    '本站仅在你切换语言时写入一个语言偏好 cookie，以便下次访问直接显示对应语言。我们不使用统计、广告或第三方追踪 cookie。',
  close: '关闭',
  linkLabel: '查看 Cookie 用途',
  title: '关于 cookie',
};

describe('CookieBanner UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('shows a non-blocking notice without consent controls', async () => {
    render(<CookieBanner cookiesHref="/zh/cookies" copy={copy} enabled />);

    const close = await screen.findByRole('button', { name: '关闭' });
    const details = screen.getByRole('link', { name: '查看 Cookie 用途' });

    expect(close).not.toBeNull();
    expect(details.getAttribute('href')).toBe('/zh/cookies');
    expect(close.className).not.toContain('btn');
    expect(screen.queryByRole('button', { name: '知道了' })).toBeNull();
    expect(screen.queryByRole('button', { name: /查看用途/ })).toBeNull();
    expect(screen.queryByText('基础访问统计')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('stores a notice acknowledgement from the close action without analytics consent', async () => {
    render(<CookieBanner cookiesHref="/zh/cookies" copy={copy} enabled />);

    fireEvent.click(await screen.findByRole('button', { name: '关闭' }));

    await waitFor(() => {
      const saved = window.localStorage.getItem(cookieNoticeStorageKey);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved ?? '{}') as {
        acknowledgedAt?: unknown;
        analytics?: unknown;
        version?: unknown;
      };

      expect(parsed).toMatchObject({ version: 1 });
      expect(typeof parsed.acknowledgedAt).toBe('string');
      expect(parsed.analytics).toBeUndefined();
      expect(window.localStorage.getItem(cookieConsentStorageKey)).toBeNull();
    });
  });

  it('does not show again when a valid notice acknowledgement exists', () => {
    window.localStorage.setItem(
      cookieNoticeStorageKey,
      JSON.stringify({
        acknowledgedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        version: 1,
      }),
    );

    render(<CookieBanner cookiesHref="/zh/cookies" copy={copy} enabled />);

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('clears legacy consent records on first render', async () => {
    window.localStorage.setItem(
      cookieConsentStorageKey,
      JSON.stringify({
        analytics: true,
        essential: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        marketing: false,
        savedAt: new Date().toISOString(),
        version: 1,
      }),
    );

    render(<CookieBanner cookiesHref="/zh/cookies" copy={copy} enabled />);

    await screen.findByRole('status');

    expect(window.localStorage.getItem(cookieConsentStorageKey)).toBeNull();
  });
});
