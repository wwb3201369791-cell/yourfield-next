'use client';

import React, { useState } from 'react';

import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';
import {
  InlineRowTextarea,
  InlineRowTextInput,
  rowHasText,
  rowKey,
  rowText,
} from '../inline/InlineControls';

export function InlineEvidenceEditor() {
  const { addRow, removeRow, rows, setRowField } =
    usePayloadFieldArray<Record<string, unknown>>('qualityEvidence');
  const [newRow, setNewRow] = useState<{
    field: 'description' | 'status' | 'title';
    index: number;
  } | null>(null);
  const startNewRow = (field: 'description' | 'status' | 'title') => {
    setNewRow({ field, index: rows.length });
    addRow({ description: '', status: '', title: '', type: 'certificate' });
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
    if (!rowHasText(row, ['title', 'status', 'description'])) {
      removeRow(index);
    }
    setNewRow(null);
  };

  return (
    <section className="ype-inline-editor" data-ype-path="qualityEvidence">
      <div className="detail-section-heading">
        <h2>资料与认证状态</h2>
      </div>
      <div className="ype-inline-list-head">
        <strong>质量证据</strong>
      </div>
      {rows.map((row, index) => (
        <article
          className="ype-inline-card-row"
          key={rowKey(row, index)}
          onBlur={(event) => removeUnusedNewRow(index, row, event)}
        >
          <InlineRowTextInput
            autoEdit={newRow?.index === index && newRow.field === 'title'}
            label="标题"
            placeholder="点击填写证据标题"
            value={rowText(row, ['title'])}
            onChange={(value) => setRowField(index, 'title', value)}
          />
          <InlineRowTextInput
            autoEdit={newRow?.index === index && newRow.field === 'status'}
            label="状态"
            placeholder="点击填写状态"
            value={rowText(row, ['status'])}
            onChange={(value) => setRowField(index, 'status', value)}
          />
          <InlineRowTextarea
            autoEdit={newRow?.index === index && newRow.field === 'description'}
            label="说明"
            placeholder="点击填写说明"
            value={rowText(row, ['description'])}
            onChange={(value) => setRowField(index, 'description', value)}
          />
          <button type="button" className="ype-inline-delete" onClick={() => removeRow(index)}>
            删除
          </button>
        </article>
      ))}
      <article className="ype-inline-card-row ype-inline-card-row--ghost">
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('title')}
        >
          点击填写证据标题
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('status')}
        >
          点击填写状态
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty is-multiline"
          onClick={() => startNewRow('description')}
        >
          点击填写说明
        </button>
      </article>
    </section>
  );
}
