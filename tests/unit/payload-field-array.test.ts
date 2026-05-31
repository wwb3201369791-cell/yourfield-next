import { describe, expect, it } from 'vitest';

import {
  resolvePayloadFieldArrayRows,
  valueAtPath,
} from '@/components/admin/product-editor/utils/payloadFieldArrayRows';

describe('usePayloadFieldArray helpers', () => {
  it('reads nested array rows from reduced Payload form values', () => {
    const values = {
      visualGroups: [
        {
          images: [{ file: 101 }],
          title: '建模图',
          variant: 'modeling',
        },
      ],
    };

    expect(valueAtPath(values, 'visualGroups')).toEqual(values.visualGroups);
  });

  it('uses reduced form rows when the top-level array field value is initially empty', () => {
    const reducedRows = [
      {
        images: [{ file: 101 }],
        title: '建模图',
        variant: 'modeling',
      },
    ];

    expect(
      resolvePayloadFieldArrayRows({
        fieldValue: [],
        hasLocalOverride: false,
        reducedValue: reducedRows,
      }),
    ).toEqual(reducedRows);
  });

  it('keeps an explicit local clear instead of rehydrating old rows', () => {
    expect(
      resolvePayloadFieldArrayRows({
        fieldValue: [],
        hasLocalOverride: true,
        reducedValue: [{ title: '旧数据' }],
      }),
    ).toEqual([]);
  });
});
