'use client';

import React, { useState } from 'react';

import { useAdminText } from '../../adminUiLocale';
import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';
import {
  InlineRowTextarea,
  InlineRowTextInput,
  rowHasText,
  rowKey,
  rowText,
} from '../inline/InlineControls';

export function InlineFaqEditor() {
  const t = useAdminText();
  const { addRow, removeRow, rows, setRowField } =
    usePayloadFieldArray<Record<string, unknown>>('productFaqs');
  const [newRow, setNewRow] = useState<{
    field: 'answer' | 'question';
    index: number;
  } | null>(null);
  const startNewRow = (field: 'answer' | 'question') => {
    setNewRow({ field, index: rows.length });
    addRow({ answer: '', question: '' });
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
    if (!rowHasText(row, ['question', 'answer'])) {
      removeRow(index);
    }
    setNewRow(null);
  };

  return (
    <section className="ype-inline-editor" data-ype-path="productFaqs">
      <div className="detail-section-heading">
        <h2>{t('常见问题')}</h2>
      </div>
      <div className="ype-inline-list-head">
        <strong>{t('问答内容')}</strong>
      </div>
      {rows.map((row, index) => (
        <article
          className="ype-inline-card-row"
          key={rowKey(row, index)}
          onBlur={(event) => removeUnusedNewRow(index, row, event)}
        >
          <InlineRowTextInput
            autoEdit={newRow?.index === index && newRow.field === 'question'}
            label="问题"
            placeholder="点击填写问题"
            value={rowText(row, ['question', 'title'])}
            onChange={(value) => setRowField(index, 'question', value)}
          />
          <InlineRowTextarea
            autoEdit={newRow?.index === index && newRow.field === 'answer'}
            label="答案"
            placeholder="点击填写答案"
            value={rowText(row, ['answer', 'text', 'description'])}
            onChange={(value) => setRowField(index, 'answer', value)}
          />
          <button type="button" className="ype-inline-delete" onClick={() => removeRow(index)}>
            {t('删除')}
          </button>
        </article>
      ))}
      <article className="ype-inline-card-row ype-inline-card-row--ghost">
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('question')}
        >
          {t('点击填写问题')}
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty is-multiline"
          onClick={() => startNewRow('answer')}
        >
          {t('点击填写答案')}
        </button>
      </article>
    </section>
  );
}
