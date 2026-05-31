/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const payloadFormState = vi.hoisted(() => ({
  addFieldRow: vi.fn(),
  dispatchFields: vi.fn(),
  removeFieldRow: vi.fn(),
  replaceFieldRow: vi.fn(),
  setValue: vi.fn(),
  value: [{ value: 'existing' }] as Array<Record<string, unknown>>,
}));

vi.mock('@payloadcms/ui', () => ({
  useField: () => ({
    setValue: payloadFormState.setValue,
    value: payloadFormState.value,
  }),
  useFormFields: (selector: (state: [Record<string, unknown>]) => unknown) => selector([{}]),
}));

import { usePayloadFieldArray } from '@/components/admin/product-editor/hooks/usePayloadFieldArray';

describe('usePayloadFieldArray', () => {
  it('adds rows by updating the field value so inline editors refresh immediately', () => {
    const { result } = renderHook(() => usePayloadFieldArray('materials'));

    result.current.addRow({ value: 'new row' });

    expect(payloadFormState.addFieldRow).not.toHaveBeenCalled();
    expect(payloadFormState.setValue).toHaveBeenCalledWith([
      { value: 'existing' },
      { value: 'new row' },
    ]);
  });
});
