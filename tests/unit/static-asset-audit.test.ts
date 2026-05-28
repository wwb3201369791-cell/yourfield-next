import { describe, expect, it } from 'vitest';

import {
  classifyPublicAsset,
  formatBytes,
  formatStaticAssetAuditMarkdown,
  summarizePublicAssets,
} from '../../scripts/static-asset-audit';

describe('static asset audit', () => {
  it('formats byte sizes for readable reports', () => {
    expect(formatBytes(1024)).toBe('1KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.00MB');
  });

  it('prioritizes videos and large product/about images for CDN migration', () => {
    expect(classifyPublicAsset('/video/home.mp4', 10).migrationPriority).toBe('high');
    expect(classifyPublicAsset('/images/products/a.png', 10).migrationPriority).toBe('high');
    expect(classifyPublicAsset('/images/about/a.jpg', 10).migrationPriority).toBe('high');
    expect(classifyPublicAsset('/images/icons/a.svg', 10).migrationPriority).toBe('medium');
  });

  it('summarizes folders, largest files, and migration candidates', () => {
    const summary = summarizePublicAssets(
      [
        {
          bytes: 270 * 1024 * 1024,
          extension: '.mp4',
          kind: 'video',
          migrationBucket: '/video',
          migrationPriority: 'high',
          publicPath: '/video/home.mp4',
        },
        {
          bytes: 120 * 1024 * 1024,
          extension: '.png',
          kind: 'image',
          migrationBucket: '/images/products',
          migrationPriority: 'high',
          publicPath: '/images/products/suit.png',
        },
        {
          bytes: 1 * 1024 * 1024,
          extension: '.woff2',
          kind: 'font',
          migrationBucket: '/fonts',
          migrationPriority: 'low',
          publicPath: '/fonts/site.woff2',
        },
      ],
      300 * 1024 * 1024,
      5,
    );

    expect(summary.overBudget).toBe(true);
    expect(summary.migrationCandidates.map((item) => item.key)).toEqual([
      '/video',
      '/images/products',
    ]);
    expect(formatStaticAssetAuditMarkdown(summary)).toContain('/video | 270.00MB | 1');
  });
});
