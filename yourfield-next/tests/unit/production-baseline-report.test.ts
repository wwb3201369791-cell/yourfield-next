import { describe, expect, it } from 'vitest';

import {
  defaultProductionBaselinePaths,
  formatProductionBaselineMarkdown,
  resolveProductionBaselineConfig,
} from '../../scripts/production-baseline';

describe('production baseline script', () => {
  it('targets the product routes that affect the reported interaction delay', () => {
    expect(defaultProductionBaselinePaths).toContain('/zh');
    expect(defaultProductionBaselinePaths).toContain('/zh/products');
    expect(defaultProductionBaselinePaths).toContain('/zh/products/firefighter-suit-combat');
  });

  it('lets CLI paths override environment paths', () => {
    const config = resolveProductionBaselineConfig(
      {
        'base-url': 'http://127.0.0.1:3100/',
        path: ['zh', 'zh/products'],
        'timeout-ms': '12000',
      },
      {
        PROD_BASELINE_BASE_URL: 'http://localhost:4000',
        PROD_BASELINE_PATHS: '/ru',
        PROD_BASELINE_TIMEOUT_MS: '30000',
      },
    );

    expect(config.baseUrl).toBe('http://127.0.0.1:3100');
    expect(config.paths).toEqual(['/zh', '/zh/products']);
    expect(config.timeoutMs).toBe(12000);
  });

  it('formats page load and transition metrics for a readable baseline report', () => {
    const markdown = formatProductionBaselineMarkdown({
      baseUrl: 'http://localhost:3100',
      generatedAt: '2026-05-22T12:00:00.000Z',
      pages: [
        {
          cls: 0,
          documentBytes: 2048,
          domContentLoadedMs: 120,
          firstImageMs: 160,
          firstImageUrl: 'http://localhost:3100/logo.png',
          loadMs: 300,
          longTaskMaxMs: 60,
          lcpMs: 240,
          path: '/zh',
          status: 200,
          totalBlockingTimeMs: 10,
          ttfbMs: 80,
        },
      ],
      transitions: [
        {
          durationMs: 180,
          from: '/zh',
          label: 'home-to-products',
          rscBytes: 4096,
          rscResponses: [{ bytes: 4096, status: 200, url: 'http://localhost:3100/?_rsc=abc' }],
          selector: 'a[href="/zh/products"]',
          settledMs: 1680,
          to: '/zh/products',
        },
      ],
    });

    expect(markdown).toContain('/zh | 200 | 80ms | 240ms');
    expect(markdown).toContain('home-to-products | /zh | /zh/products | 180ms | 1680ms | 4KB');
  });
});
