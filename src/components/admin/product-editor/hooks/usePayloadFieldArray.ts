'use client';

import { useField } from '@payloadcms/ui';
import { useMemo } from 'react';

type ArrayRow = Record<string, unknown>;
type RowPatch<T extends ArrayRow> = Partial<T> | T;

export function usePayloadFieldArray<T extends ArrayRow = ArrayRow>(path: string) {
  const { value, setValue } = useField<T[]>({ path });
  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  return useMemo(
    () => ({
      addRow: (row: RowPatch<T> = {}) => {
        setValue([...rows, row]);
      },
      moveRow: (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
          return;
        }
        const nextRows = [...rows];
        const [row] = nextRows.splice(from, 1);
        if (!row) return;
        nextRows.splice(to, 0, row);
        setValue(nextRows);
      },
      removeRow: (index: number) => {
        setValue(rows.filter((_, rowIndex) => rowIndex !== index));
      },
      replaceRow: (index: number, row: RowPatch<T>) => {
        setValue(
          rows.map((existingRow, rowIndex) =>
            rowIndex === index ? { ...existingRow, ...row } : existingRow,
          ),
        );
      },
      clearRows: () => {
        setValue([]);
      },
      rows,
      setRows: setValue,
      setRowField: (index: number, key: keyof T, fieldValue: unknown) => {
        setValue(
          rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: fieldValue } : row)),
        );
      },
    }),
    [rows, setValue],
  );
}
