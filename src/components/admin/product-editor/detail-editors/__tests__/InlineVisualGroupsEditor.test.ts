import { describe, expect, it } from 'vitest';

import {
  buildVisualUploadDisplayTargets,
  type VisualGroupRow,
} from '../../utils/visualUploadTargets';

describe('InlineVisualGroupsEditor visual group targets', () => {
  it('renders existing product gallery/detail groups instead of only hard-coded scene/model cards', () => {
    const rows: VisualGroupRow[] = [
      {
        images: Array.from({ length: 10 }, (_, index) => ({ file: index + 1 })),
        title: '产品图册',
        variant: 'gallery',
      },
      {
        images: Array.from({ length: 4 }, (_, index) => ({ file: index + 20 })),
        title: '建模图',
        variant: 'detail',
      },
    ];

    const targets = buildVisualUploadDisplayTargets(rows);

    expect(targets).toHaveLength(2);
    expect(targets.map((target) => target.variant)).toEqual(['gallery', 'detail']);
    expect(targets.map((target) => target.title)).toEqual(['产品图册', '建模图']);
    expect(targets.map((target) => target.rowIndex)).toEqual([0, 1]);
    expect(targets.some((target) => target.title === '场景图')).toBe(false);
  });

  it('keeps default add targets only for products that do not have visual groups yet', () => {
    const targets = buildVisualUploadDisplayTargets([]);

    expect(targets.map((target) => target.variant)).toEqual([
      'gallery',
      'detail',
      'scene',
      'modeling',
      'model',
      'certificate',
      'comparison',
    ]);
  });
});
