 'use client';

import { useField } from 'payload/components/forms';
import React from 'react';

import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';

type FieldSpec = Readonly<{
  help?: string;
  kind?: 'text' | 'textarea' | 'array' | 'readonly';
  label: string;
  path: string;
}>;

type Props = Readonly<{
  description?: string;
  fields: readonly FieldSpec[];
  title: string;
}>;

function TextControl({ field }: { field: FieldSpec }) {
  const { setValue, value } = useField<string>({ path: field.path });

  if (field.kind === 'readonly') {
    return <pre className="ype-field-readonly">{JSON.stringify(value ?? null, null, 2)}</pre>;
  }

  const commonProps = {
    value: typeof value === 'string' ? value : '',
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(event.target.value),
  };

  return field.kind === 'textarea' ? (
    <textarea rows={4} {...commonProps} />
  ) : (
    <input type="text" {...commonProps} />
  );
}

function ArrayControl({ field }: { field: FieldSpec }) {
  const { addRow, removeRow, rows, setRowField } = usePayloadFieldArray(field.path);

  return (
    <div className="ype-array-field">
      {rows.length === 0 ? <p className="ype-field-help">暂无内容。</p> : null}
      {rows.map((row, index) => {
        const value = typeof row.value === 'string' ? row.value : typeof row.title === 'string' ? row.title : '';
        return (
          <div className="ype-array-row" key={index}>
            <input value={value} onChange={(event) => setRowField(index, 'value', event.target.value)} />
            <button type="button" onClick={() => removeRow(index)}>
              删除
            </button>
          </div>
        );
      })}
      <button type="button" onClick={() => addRow({ value: '' })}>
        添加一行
      </button>
    </div>
  );
}

export function SectionFieldDrawer({ description, fields, title }: Props) {
  return (
    <section className="ype-field-drawer">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {fields.map((field) => (
        <label className="ype-field" key={field.path}>
          <span>{field.label}</span>
          {field.kind === 'array' ? <ArrayControl field={field} /> : <TextControl field={field} />}
          {field.help ? <small>{field.help}</small> : null}
        </label>
      ))}
      <p className="ype-field-help">上传、关系、富文本等复杂字段仍可通过“经典表单”使用 Payload 原生控件编辑。</p>
    </section>
  );
}
