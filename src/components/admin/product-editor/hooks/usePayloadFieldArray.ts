'use client';

import { useField, useFormFields } from '@payloadcms/ui';
import { reduceFieldsToValues } from 'payload/shared';
import { useCallback, useMemo, useState } from 'react';

import { useHydratedProductDocumentValue } from '../ProductEditorHydrationContext';
import {
  resolvePayloadFieldArrayRows,
  valueAtPath,
  type PayloadArrayRow,
} from '../utils/payloadFieldArrayRows';

type ArrayRow = PayloadArrayRow;
type RowPatch<T extends ArrayRow> = Partial<T> | T;

export function usePayloadFieldArray<T extends ArrayRow = ArrayRow>(path: string) {
  const { value, setValue } = useField<T[]>({ path });
  const fields = useFormFields(([formFields]) => formFields);
  const [hasLocalOverride, setHasLocalOverride] = useState(false);
  const fallbackValue = useHydratedProductDocumentValue(path);
  const reducedValue = useMemo(() => {
    const values = reduceFieldsToValues(fields, true, true) as Record<string, unknown>;
    return valueAtPath(values, path);
  }, [fields, path]);

  const rows = useMemo(
    () =>
      resolvePayloadFieldArrayRows<T>({
        fallbackValue,
        fieldValue: value,
        hasLocalOverride,
        path,
        reducedValue,
      }),
    [fallbackValue, hasLocalOverride, path, reducedValue, value],
  );
  const setRows = useCallback(
    (nextRows: T[]) => {
      setHasLocalOverride(true);
      setValue(nextRows);
    },
    [setValue],
  );

  return useMemo(
    () => ({
      addRow: (row: RowPatch<T> = {}) => {
        setRows([...rows, row as T]);
      },
      moveRow: (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
          return;
        }
        const nextRows = [...rows];
        const [row] = nextRows.splice(from, 1);
        if (!row) return;
        nextRows.splice(to, 0, row);
        setRows(nextRows);
      },
      removeRow: (index: number) => {
        setRows(rows.filter((_, rowIndex) => rowIndex !== index));
      },
      replaceRow: (index: number, row: RowPatch<T>) => {
        setRows(
          rows.map((existingRow, rowIndex) =>
            rowIndex === index ? { ...existingRow, ...row } : existingRow,
          ),
        );
      },
      clearRows: () => {
        setRows([]);
      },
      rows,
      setRows,
      setRowField: (index: number, key: keyof T, fieldValue: unknown) => {
        setRows(
          rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: fieldValue } : row)),
        );
      },
    }),
    [rows, setRows],
  );
}
