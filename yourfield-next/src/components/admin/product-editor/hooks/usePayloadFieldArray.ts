 'use client';

import { useField, useForm } from 'payload/components/forms';
import { useMemo } from 'react';

type ArrayRow = Record<string, unknown>;

export function usePayloadFieldArray<T extends ArrayRow = ArrayRow>(path: string) {
  const { addFieldRow, dispatchFields, removeFieldRow, replaceFieldRow } = useForm();
  const { value, setValue } = useField<T[]>({ path });
  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  return useMemo(
    () => ({
      addRow: (row: Partial<T> = {}) => {
        if (typeof addFieldRow === 'function') {
          void addFieldRow({ data: row, path });
          return;
        }
        setValue([...rows, row]);
      },
      moveRow: (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
          return;
        }
        if (typeof dispatchFields === 'function') {
          dispatchFields({ moveFromIndex: from, moveToIndex: to, path, type: 'MOVE_ROW' });
          return;
        }
        const nextRows = [...rows];
        const [row] = nextRows.splice(from, 1);
        if (!row) return;
        nextRows.splice(to, 0, row);
        setValue(nextRows);
      },
      removeRow: (index: number) => {
        if (typeof removeFieldRow === 'function') {
          removeFieldRow({ path, rowIndex: index });
          return;
        }
        setValue(rows.filter((_, rowIndex) => rowIndex !== index));
      },
      replaceRow: (index: number, row: Partial<T>) => {
        if (typeof replaceFieldRow === 'function') {
          void replaceFieldRow({ data: row, path, rowIndex: index });
          return;
        }
        setValue(rows.map((existingRow, rowIndex) => (rowIndex === index ? { ...existingRow, ...row } : existingRow)));
      },
      rows,
      setRows: setValue,
      setRowField: (index: number, key: keyof T, fieldValue: unknown) => {
        setValue(
          rows.map((row, rowIndex) =>
            rowIndex === index ? { ...row, [key]: fieldValue } : row,
          ),
        );
      },
    }),
    [addFieldRow, dispatchFields, path, removeFieldRow, replaceFieldRow, rows, setValue],
  );
}
