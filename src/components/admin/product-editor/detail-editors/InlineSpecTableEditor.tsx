'use client';

import React, { useState } from 'react';

import { useAdminText } from '../../adminUiLocale';
import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';
import { InlineEditableText, rowHasText, rowKey, rowText } from '../inline/InlineControls';

export function InlineSpecTableEditor() {
  const t = useAdminText();
  const { addRow, removeRow, rows, setRowField } =
    usePayloadFieldArray<Record<string, unknown>>('specifications');
  const [newRow, setNewRow] = useState<{
    field: 'label' | 'value';
    index: number;
  } | null>(null);
  const startNewRow = (field: 'label' | 'value') => {
    setNewRow({ field, index: rows.length });
    addRow({ label: '', value: '' });
  };
  const removeUnusedNewRow = (
    index: number,
    row: Record<string, unknown>,
    event: React.FocusEvent<HTMLElement>,
  ) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    if (newRow?.index !== index) return;
    if (!rowHasText(row, ['label', 'value'])) {
      removeRow(index);
    }
    setNewRow(null);
  };

  return (
    <section className="ype-inline-editor" data-ype-path="specifications">
      <div className="detail-section-heading">
        <h2>{t('参数规格')}</h2>
      </div>
      <div className="ype-inline-list-head">
        <strong>{t('参数表')}</strong>
      </div>
      {rows.map((row, index) => (
        <div
          className="ype-inline-spec-row"
          key={rowKey(row, index)}
          onBlur={(event) => removeUnusedNewRow(index, row, event)}
        >
          <InlineEditableText
            autoEdit={newRow?.index === index && newRow.field === 'label'}
            label={`${t('参数名')} ${index + 1}`}
            value={rowText(row, ['label'])}
            placeholder={t('参数名')}
            onChange={(value) => setRowField(index, 'label', value)}
          />
          <InlineEditableText
            autoEdit={newRow?.index === index && newRow.field === 'value'}
            label={`${t('参数值')} ${index + 1}`}
            value={rowText(row, ['value'])}
            placeholder={t('参数值')}
            onChange={(value) => setRowField(index, 'value', value)}
          />
          <button type="button" onClick={() => removeRow(index)}>
            {t('删除')}
          </button>
        </div>
      ))}
      <div className="ype-inline-spec-row ype-inline-spec-row--ghost">
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('label')}
        >
          {t(rows.length > 0 ? '添加参数名' : '点击填写参数名')}
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('value')}
        >
          {t(rows.length > 0 ? '添加参数值' : '点击填写参数值')}
        </button>
      </div>
    </section>
  );
}
