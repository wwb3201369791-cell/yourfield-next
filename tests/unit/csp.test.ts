import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, getCspOrigin } from '@/lib/security/csp';

function getDirective(policy: string, name: string) {
  return policy.split('; ').find((directive) => directive.startsWith(`${name} `));
}

describe('content security policy', () => {
  it('uses a nonce for production scripts instead of unsafe inline scripts', () => {
    const policy = buildContentSecurityPolicy({
      allowEval: false,
      nonce: 'abc123+/=',
      publicMediaOrigin: 'https://cdn.example.com',
    });
    const scriptSrc = getDirective(policy, 'script-src');

    expect(scriptSrc).toContain("'nonce-abc123+/='");
    expect(scriptSrc).toContain('https://challenges.cloudflare.com');
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('keeps the development eval exception separate from inline script execution', () => {
    const policy = buildContentSecurityPolicy({
      allowEval: true,
      nonce: 'devNonce',
    });
    const scriptSrc = getDirective(policy, 'script-src');

    expect(scriptSrc).toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('preserves the configured public media origin for uploaded media', () => {
    const policy = buildContentSecurityPolicy({
      allowEval: false,
      nonce: 'mediaNonce',
      publicMediaOrigin: getCspOrigin('https://cdn.example.com/assets/'),
    });

    expect(getDirective(policy, 'media-src')).toContain('https://cdn.example.com');
  });

  it('rejects nonce values that could break the CSP header', () => {
    expect(() =>
      buildContentSecurityPolicy({
        allowEval: false,
        nonce: 'bad<nonce>',
      }),
    ).toThrow('CSP nonce contains invalid characters.');
  });
});
