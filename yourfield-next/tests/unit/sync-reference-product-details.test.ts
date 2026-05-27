import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildReferenceProductUpdateData,
  parseReferenceProductMarkdown,
  referenceProductTargets,
} from '../../scripts/seed/sync-reference-product-details';

const referenceRoot = path.resolve(process.cwd(), '资料文件');
const firstTarget = referenceProductTargets[0];

if (!firstTarget) {
  throw new Error('Expected at least one reference product target.');
}

describe('reference product detail sync helpers', () => {
  it('parses structured reference details from the split product files', () => {
    const info = parseReferenceProductMarkdown(path.join(referenceRoot, firstTarget.sourcePath));

    expect(info).toMatchObject({
      name: '1级防电弧服（衬衫款）',
      model: 'HYF-3801',
      color: '浅蓝、藏青',
      sizeRange: '160-195',
    });
    expect(info.standard).toContain('DL/T 320-2019');
    expect(info.standard).toContain('；GB 8965.4-2022');
    expect(info.applications).toContain('电弧伤害');
    expect(info.selection).toContain('低压配电房');
  });

  it('builds professional frontend content without source-sync wording', () => {
    const info = parseReferenceProductMarkdown(path.join(referenceRoot, firstTarget.sourcePath));
    const updateData = buildReferenceProductUpdateData(info);
    const serialized = JSON.stringify(updateData);

    expect(updateData.sellingPoints.map((point) => point.title)).toEqual([
      '标准依据',
      '场景适配',
      '选用建议',
    ]);
    expect(updateData.qualityEvidence[0]).toMatchObject({
      status: '有检测报告',
      title: '检测与标准说明',
    });
    expect(updateData.sizeGuide.rows[0]).toEqual({
      label: '可选尺码',
      values: ['160-195'],
    });
    expect(serialized).not.toContain('官网资料');
    expect(serialized).not.toContain('同步');
  });

  it('keeps the import scope to explicitly matched product documents', () => {
    const targetProductCount = referenceProductTargets.reduce(
      (total, target) => total + target.productIds.length,
      0,
    );

    expect(referenceProductTargets).toHaveLength(14);
    expect(targetProductCount).toBe(15);
  });
});
