'use client';

import { useField } from 'payload/components/forms';
import React from 'react';

import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';

type SizeGuideCell = {
  id?: string | null;
  value?: string | null;
};

type SizeGuideColumn = {
  id?: string | null;
  label?: string | null;
};

type SizeGuideRow = {
  id?: string | null;
  label?: string | null;
  values?: SizeGuideCell[] | null;
};

const sampleColumns = ['50-55', '55-65', '65-75', '75-85', '80-90', '90-100', '100-110'];

const sampleRows: Array<Readonly<{ label: string; values: readonly string[] }>> = [
  { label: '163-167', values: ['165A', '165B', '', '', '', '', ''] },
  { label: '168-172', values: ['', '170A', '170B', '', '', '', ''] },
  { label: '173-177', values: ['', '', '175A', '175B', '', '', ''] },
  { label: '178-182', values: ['', '', '', '180A', '180B', '', ''] },
  { label: '183-187', values: ['', '', '', '', '185A', '185B', ''] },
  { label: '188-192', values: ['', '', '', '', '', '190A', '190B'] },
];

function textValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function guideHasContent({
  columns,
  cornerLabel,
  rows,
  title,
}: {
  columns: readonly SizeGuideColumn[];
  cornerLabel: string;
  rows: readonly SizeGuideRow[];
  title: string;
}) {
  const hasColumns = columns.some((column) => textValue(column.label).trim());
  const hasRows = rows.some(
    (row) =>
      textValue(row.label).trim() ||
      (row.values ?? []).some((cell) => textValue(cell.value).trim()),
  );

  return Boolean(title.trim() || cornerLabel.trim() || hasColumns || hasRows);
}

function ensureCell(row: SizeGuideRow, columnIndex: number): SizeGuideCell {
  return row.values?.[columnIndex] ?? { value: '' };
}

export function SizeGuideDrawer() {
  const { setValue: setTitle, value: titleValue } = useField<string>({
    path: 'sizeGuide.title',
  });
  const { setValue: setCornerLabel, value: cornerLabelValue } = useField<string>({
    path: 'sizeGuide.cornerLabel',
  });
  const { rows: columns, setRows: setColumns } =
    usePayloadFieldArray<SizeGuideColumn>('sizeGuide.columns');
  const { rows, setRowField, setRows } = usePayloadFieldArray<SizeGuideRow>('sizeGuide.rows');
  const title = textValue(titleValue);
  const cornerLabel = textValue(cornerLabelValue);
  const hasContent = guideHasContent({ columns, cornerLabel, rows, title });

  const clearGuide = () => {
    setTitle('');
    setCornerLabel('');
    setColumns([]);
    setRows([]);
  };

  const applySampleGuide = () => {
    setTitle('尺码对应表');
    setCornerLabel('身高 cm / 体重 kg');
    setColumns(sampleColumns.map((label) => ({ label })));
    setRows(
      sampleRows.map((row) => ({
        label: row.label,
        values: row.values.map((value) => ({ value })),
      })),
    );
  };

  const updateColumn = (columnIndex: number, label: string) => {
    setColumns(
      columns.map((column, index) => (index === columnIndex ? { ...column, label } : column)),
    );
  };

  const addColumn = () => {
    setColumns([...columns, { label: '' }]);
    setRows(rows.map((row) => ({ ...row, values: [...(row.values ?? []), { value: '' }] })));
  };

  const removeColumn = (columnIndex: number) => {
    setColumns(columns.filter((_, index) => index !== columnIndex));
    setRows(
      rows.map((row) => ({
        ...row,
        values: (row.values ?? []).filter((_, index) => index !== columnIndex),
      })),
    );
  };

  const updateRowLabel = (rowIndex: number, label: string) => {
    setRowField(rowIndex, 'label', label);
  };

  const addRow = () => {
    setRows([...rows, { label: '', values: columns.map(() => ({ value: '' })) }]);
  };

  const removeRow = (rowIndex: number) => {
    setRows(rows.filter((_, index) => index !== rowIndex));
  };

  const updateCell = (rowIndex: number, columnIndex: number, cellValue: string) => {
    setRows(
      rows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextValues = Array.from({ length: columns.length }, (_, cellIndex) => ({
          ...ensureCell(row, cellIndex),
          value:
            cellIndex === columnIndex ? cellValue : textValue(ensureCell(row, cellIndex).value),
        }));

        return { ...row, values: nextValues };
      }),
    );
  };

  return (
    <section className="ype-field-drawer ype-size-guide-editor" data-ype-path="sizeGuide">
      <div className="ype-size-guide-head">
        <div>
          <h2>尺码对应表</h2>
          <p>有尺码表就填写；没有可以清空，前台不会展示这个区块。</p>
        </div>
        {hasContent ? (
          <button type="button" className="ype-size-guide-secondary" onClick={clearGuide}>
            清空
          </button>
        ) : null}
      </div>

      {!hasContent ? (
        <div className="ype-size-guide-empty">
          <strong>当前产品未配置尺码表</strong>
          <button type="button" onClick={applySampleGuide}>
            添加示例表格
          </button>
        </div>
      ) : (
        <>
          <div className="ype-size-guide-meta">
            <label className="ype-field" data-ype-path="sizeGuide.title">
              <span className="ype-field-label">标题</span>
              <input
                type="text"
                value={title}
                placeholder="尺码对应表"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="ype-field" data-ype-path="sizeGuide.cornerLabel">
              <span className="ype-field-label">左上角表头</span>
              <input
                type="text"
                value={cornerLabel}
                placeholder="身高 cm / 体重 kg"
                onChange={(event) => setCornerLabel(event.target.value)}
              />
            </label>
          </div>

          <div className="ype-size-guide-actions">
            <button type="button" onClick={addColumn}>
              添加体重列
            </button>
            <button type="button" onClick={addRow} disabled={columns.length === 0}>
              添加身高行
            </button>
          </div>

          {columns.length === 0 ? (
            <p className="ype-field-help">先添加体重列，再填写每个身高区间对应的尺码。</p>
          ) : (
            <div className="ype-size-guide-table-wrap">
              <table className="ype-size-guide-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <span>{cornerLabel || '身高 / 体重'}</span>
                    </th>
                    {columns.map((column, columnIndex) => (
                      <th scope="col" key={column.id ?? columnIndex}>
                        <input
                          aria-label={`体重列 ${columnIndex + 1}`}
                          data-ype-path={`sizeGuide.columns.${columnIndex}.label`}
                          type="text"
                          value={textValue(column.label)}
                          placeholder="体重段"
                          onChange={(event) => updateColumn(columnIndex, event.target.value)}
                        />
                        <button type="button" onClick={() => removeColumn(columnIndex)}>
                          删除列
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id ?? rowIndex}>
                      <th scope="row">
                        <input
                          aria-label={`身高行 ${rowIndex + 1}`}
                          data-ype-path={`sizeGuide.rows.${rowIndex}.label`}
                          type="text"
                          value={textValue(row.label)}
                          placeholder="身高区间"
                          onChange={(event) => updateRowLabel(rowIndex, event.target.value)}
                        />
                        <button type="button" onClick={() => removeRow(rowIndex)}>
                          删除行
                        </button>
                      </th>
                      {columns.map((column, columnIndex) => (
                        <td key={`${row.id ?? rowIndex}-${column.id ?? columnIndex}`}>
                          <input
                            aria-label={`${textValue(row.label) || `第 ${rowIndex + 1} 行`} / ${
                              textValue(column.label) || `第 ${columnIndex + 1} 列`
                            }`}
                            data-ype-path={`sizeGuide.rows.${rowIndex}.values.${columnIndex}.value`}
                            type="text"
                            value={textValue(ensureCell(row, columnIndex).value)}
                            placeholder="-"
                            onChange={(event) =>
                              updateCell(rowIndex, columnIndex, event.target.value)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <div className="ype-size-guide-no-rows">还没有身高行。</div>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}
