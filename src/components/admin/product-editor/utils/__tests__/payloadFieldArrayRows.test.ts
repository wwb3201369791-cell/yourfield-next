import { describe, expect, it } from 'vitest';

import {
  hasDisplayablePayloadArrayRows,
  resolvePayloadFieldArrayRows,
  valueAtPath,
} from '../payloadFieldArrayRows';

describe('payload field array row resolution', () => {
  it('uses hydrated fallback rows when Payload form state starts empty or only has placeholder rows', () => {
    expect(
      resolvePayloadFieldArrayRows({
        fallbackValue: [{ value: '棉/氨纶/导电纤维' }],
        fieldValue: [],
        hasLocalOverride: false,
        path: 'materials',
        reducedValue: undefined,
      }),
    ).toEqual([{ value: '棉/氨纶/导电纤维' }]);

    expect(
      resolvePayloadFieldArrayRows({
        fallbackValue: [{ value: '干式水域救援防护材料' }],
        fieldValue: [{ id: 'placeholder-row', value: '' }],
        hasLocalOverride: false,
        path: 'materials',
        reducedValue: [{ id: 'reduced-placeholder', value: '   ' }],
      }),
    ).toEqual([{ value: '干式水域救援防护材料' }]);
  });

  it('does not reintroduce hydrated fallback rows after a local clear', () => {
    expect(
      resolvePayloadFieldArrayRows({
        fallbackValue: [{ value: '旧材料' }],
        fieldValue: [],
        hasLocalOverride: true,
        reducedValue: undefined,
      }),
    ).toEqual([]);
  });

  it('prefers live field or reduced form values over hydrated fallback rows', () => {
    expect(
      resolvePayloadFieldArrayRows({
        fallbackValue: [{ value: '接口材料' }],
        fieldValue: [{ value: '表单材料' }],
        hasLocalOverride: false,
        reducedValue: [{ value: '展开材料' }],
      }),
    ).toEqual([{ value: '表单材料' }]);

    expect(
      resolvePayloadFieldArrayRows({
        fallbackValue: [{ value: '接口材料' }],
        fieldValue: [],
        hasLocalOverride: false,
        reducedValue: [{ value: '展开材料' }],
      }),
    ).toEqual([{ value: '展开材料' }]);
  });

  it('uses hydrated fallback visual groups when current rows only contain empty group placeholders', () => {
    expect(
      resolvePayloadFieldArrayRows({
        fallbackValue: [
          {
            images: [{ file: 31 }],
            title: '产品图册',
            variant: 'scene',
          },
        ],
        fieldValue: [{ images: [], title: '场景图', variant: 'scene' }],
        hasLocalOverride: false,
        path: 'visualGroups',
        reducedValue: undefined,
      }),
    ).toEqual([{ images: [{ file: 31 }], title: '产品图册', variant: 'scene' }]);
  });

  it('detects displayable rows by row shape, not only array length', () => {
    expect(hasDisplayablePayloadArrayRows([{}], 'materials')).toBe(false);
    expect(hasDisplayablePayloadArrayRows([{ id: 'row-id', value: '  ' }], 'materials')).toBe(
      false,
    );
    expect(hasDisplayablePayloadArrayRows([{ value: '干式水域救援防护材料' }], 'materials')).toBe(
      true,
    );
    expect(hasDisplayablePayloadArrayRows([{ images: [], title: '场景图' }], 'visualGroups')).toBe(
      false,
    );
    expect(
      hasDisplayablePayloadArrayRows([{ images: [{ file: 31 }], title: '场景图' }], 'visualGroups'),
    ).toBe(true);
    expect(
      hasDisplayablePayloadArrayRows(
        [{ images: [{ file: { relationTo: 'media', value: 31 } }], title: '场景图' }],
        'visualGroups',
      ),
    ).toBe(true);
  });

  it('reads nested values by dotted path', () => {
    expect(valueAtPath({ visualGroups: [{ images: [{ file: 31 }] }] }, 'visualGroups')).toEqual([
      { images: [{ file: 31 }] },
    ]);
  });
});
