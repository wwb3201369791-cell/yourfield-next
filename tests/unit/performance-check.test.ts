import { describe, expect, it } from 'vitest';

import {
  formatResult,
  redactUrlForDisplay,
  resolvePerformanceCheckConfig,
} from '../../scripts/performance-check';

describe('performance-check script configuration', () => {
  it('uses a local smoke threshold by default and a stricter CI threshold in CI', () => {
    expect(resolvePerformanceCheckConfig({}, { CI: 'false' }).thresholdMs).toBe(2500);
    expect(resolvePerformanceCheckConfig({}, { CI: 'true' }).thresholdMs).toBe(1500);
  });

  it('lets CLI values override environment defaults', () => {
    const config = resolvePerformanceCheckConfig(
      {
        'base-url': 'http://127.0.0.1:3000',
        path: ['/zh', '/en'],
        'threshold-ms': '1800',
      },
      {
        PERF_CHECK_BASE_URL: 'http://localhost:4000',
        PERF_CHECK_PATHS: '/ru',
        PERF_CHECK_THRESHOLD_MS: '2200',
      },
    );

    expect(config.baseUrl).toBe('http://127.0.0.1:3000');
    expect(config.paths).toEqual(['/zh', '/en']);
    expect(config.thresholdMs).toBe(1800);
  });

  it('redacts credentials and query strings before printing the base URL', () => {
    expect(redactUrlForDisplay('https://user:pass@example.com/zh?token=secret')).toBe(
      'https://redacted:redacted@example.com/zh?redacted',
    );
  });

  it('marks responses slow only when they exceed the configured threshold', () => {
    expect(
      formatResult(
        {
          bytes: 120_000,
          durationMs: 1800,
          ok: true,
          path: '/zh',
          status: 200,
        },
        2500,
        500_000,
      ),
    ).toContain('time=1800ms(ok)');
  });
});
