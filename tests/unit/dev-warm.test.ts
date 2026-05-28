import { describe, expect, it } from 'vitest';

import {
  buildWarmUrl,
  defaultWarmPaths,
  formatWarmResult,
  normalizeWarmPath,
  parseWarmPathList,
  resolveWarmConfig,
} from '../../scripts/dev-warm';

describe('dev-warm script configuration', () => {
  it('prewarms the routes that affect the home page product interaction', () => {
    expect(defaultWarmPaths).toContain('/zh');
    expect(defaultWarmPaths).toContain('/zh/products');
    expect(defaultWarmPaths).toContain('/zh/products/firefighter-suit-combat');
    expect(defaultWarmPaths).toContain('/zh/products/arc-flash-suit');
  });

  it('normalizes CLI and environment route lists', () => {
    expect(normalizeWarmPath('zh/products')).toBe('/zh/products');
    expect(parseWarmPathList('zh,/zh/about, /zh/products/firefighter-suit-combat ')).toEqual([
      '/zh',
      '/zh/about',
      '/zh/products/firefighter-suit-combat',
    ]);
  });

  it('lets CLI paths override environment paths', () => {
    const config = resolveWarmConfig(
      {
        'base-url': 'http://127.0.0.1:3000/',
        path: ['zh', 'zh/products'],
        'timeout-ms': '12000',
        'warm-only': true,
      },
      {
        DEV_WARM_BASE_URL: 'http://localhost:4000',
        DEV_WARM_PATHS: '/ru',
        DEV_WARM_TIMEOUT_MS: '30000',
      },
    );

    expect(config.baseUrl).toBe('http://127.0.0.1:3000');
    expect(config.paths).toEqual(['/zh', '/zh/products']);
    expect(config.timeoutMs).toBe(12000);
    expect(config.warmOnly).toBe(true);
  });

  it('builds and formats warm requests for readable local diagnosis', () => {
    expect(buildWarmUrl('http://localhost:3000', 'zh/products')).toBe(
      'http://localhost:3000/zh/products',
    );
    expect(
      formatWarmResult({
        bytes: 1000,
        durationMs: 420,
        ok: true,
        path: '/zh',
        status: 200,
      }),
    ).toContain('/zh status=200(ok) time=420ms bytes=1000');
  });
});
