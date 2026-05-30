'use client';

import { RelationshipField, useField } from '@payloadcms/ui';
import React, { useEffect, useRef, useState } from 'react';

import { useAdminText } from '../../adminUiLocale';
import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';
import {
  getMediaOriginalUrl,
  getMediaPreviewUrl,
  type ProductImageMedia,
} from '../utils/productImageUpload';

type InlineTextFieldProps = Readonly<{
  className?: string;
  hideLabel?: boolean;
  label: string;
  multiline?: boolean;
  path: string;
  placeholder?: string;
  rows?: number;
}>;

type InlineStringListProps = Readonly<{
  addLabel?: string;
  itemKey?: string;
  label: string;
  path: string;
  placeholder?: string;
}>;

type InlineCardListProps = Readonly<{
  addLabel: string;
  descriptionKey?: 'description' | 'text';
  descriptionLabel: string;
  path: string;
  titleLabel: string;
}>;

export type VisualGroupImageRow = Record<string, unknown> & {
  file?: ProductImageMedia | number | string | null;
};

export type VisualGroupRow = Record<string, unknown> & {
  description?: string;
  images?: VisualGroupImageRow[];
  title?: string;
  variant?: string;
};

export type VisualUploadTarget = Readonly<{
  description: string;
  title: string;
  variant: 'model' | 'modeling' | 'scene';
}>;

export const visualUploadTargets: readonly VisualUploadTarget[] = [
  {
    description: '产品在真实使用场景里的图片。',
    title: '场景图',
    variant: 'scene',
  },
  {
    description: '产品结构、款式或建模展示图。',
    title: '建模图',
    variant: 'modeling',
  },
  {
    description: '模特穿着或上身效果图。',
    title: '模特上身图',
    variant: 'model',
  },
];

export function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  if (typeof record.value === 'string') return record.value;
  if (typeof record.label === 'string') return record.label;
  if (typeof record.title === 'string') return record.title;

  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    const nested = node as Record<string, unknown>;
    if (typeof nested.text === 'string') {
      parts.push(nested.text);
    }
    if (Array.isArray(nested.children)) {
      nested.children.forEach(walk);
    }
    if (nested.root) {
      walk(nested.root);
    }
  };

  walk(value);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function rowText(row: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = textFromUnknown(row[key]);
    if (value.trim()) {
      return value;
    }
  }

  return '';
}

export function rowKey(row: Record<string, unknown>, index: number) {
  return typeof row.id === 'string' && row.id ? row.id : `${index}`;
}

function isProductImageMedia(value: unknown): value is ProductImageMedia {
  return Boolean(value && typeof value === 'object');
}

export function imageMediaId(value: VisualGroupImageRow['file']) {
  if (isProductImageMedia(value)) {
    return value.id;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && !/^(https?:|\/|data:image\/|blob:)/i.test(value)) {
    return value;
  }

  return undefined;
}

export function imageUrlFromVisualRow(
  row: VisualGroupImageRow,
  resolvedMedia: Record<string, ProductImageMedia>,
) {
  const file = row.file;

  if (typeof file === 'string' && /^(https?:|\/|data:image\/|blob:)/i.test(file)) {
    return file;
  }

  if (isProductImageMedia(file)) {
    return getMediaOriginalUrl(file) || getMediaPreviewUrl(file);
  }

  const id = imageMediaId(file);

  return typeof id !== 'undefined'
    ? getMediaOriginalUrl(resolvedMedia[String(id)]) ||
        getMediaPreviewUrl(resolvedMedia[String(id)])
    : '';
}

export function rowHasText(row: Record<string, unknown>, keys: readonly string[]) {
  return keys.some((key) => rowText(row, [key]).trim());
}

function focusEditableField(
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  editing: boolean,
) {
  if (!editing) return;
  window.requestAnimationFrame(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  });
}

export function InlineEditableText({
  autoEdit = false,
  className = '',
  label,
  multiline = false,
  onBlur,
  onChange,
  placeholder,
  rows = 3,
  value,
}: Readonly<{
  autoEdit?: boolean;
  className?: string;
  label: string;
  multiline?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  rows?: number;
  value: string;
}>) {
  const t = useAdminText();
  const [editing, setEditing] = useState(autoEdit);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const displayValue = value.trim();
  const isEmpty = !displayValue;
  const localizedLabel = t(label);
  const localizedPlaceholder = placeholder ? t(placeholder) : undefined;
  const displayText =
    displayValue ||
    localizedPlaceholder ||
    t({ en: `Add ${localizedLabel}`, zh: `点击填写${label}` });

  useEffect(() => {
    if (autoEdit) {
      setEditing(true);
    }
  }, [autoEdit]);

  useEffect(() => {
    focusEditableField(inputRef, editing);
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        className={`ype-click-edit ${multiline ? 'is-multiline' : ''} ${
          isEmpty ? 'is-empty' : ''
        } ${className}`}
        onClick={() => setEditing(true)}
      >
        {displayText}
      </button>
    );
  }

  const stopEditing = () => {
    setEditing(false);
    onBlur?.();
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        aria-label={localizedLabel}
        className={`ype-click-edit-input ${className}`}
        rows={rows}
        value={value}
        placeholder={localizedPlaceholder}
        onBlur={stopEditing}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      aria-label={localizedLabel}
      className={`ype-click-edit-input ${className}`}
      type="text"
      value={value}
      placeholder={localizedPlaceholder}
      onBlur={stopEditing}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function InlineTextField({
  className = '',
  hideLabel = false,
  label,
  multiline = false,
  path,
  placeholder,
  rows = 3,
}: InlineTextFieldProps) {
  const t = useAdminText();
  const { setValue, value } = useField<string | Record<string, unknown>>({ path });
  const inputValue = textFromUnknown(value);

  return (
    <span className={`ype-inline-field ${className}`} data-ype-path={path}>
      <span className={hideLabel ? 'ype-visually-hidden' : undefined}>{t(label)}</span>
      <InlineEditableText
        label={t(label)}
        multiline={multiline}
        rows={rows}
        value={inputValue}
        placeholder={placeholder ? t(placeholder) : undefined}
        onChange={setValue}
      />
    </span>
  );
}

export function InlineProductGroupField({ value }: Readonly<{ value: string }>) {
  const t = useAdminText();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="ype-inline-relationship-edit" data-ype-path="productGroup">
        <RelationshipField
          field={{
            label: t('类别'),
            name: 'productGroup',
            relationTo: 'product-groups',
          }}
          path="productGroup"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`ype-click-edit ${value ? '' : 'is-empty'}`}
      data-ype-path="productGroup"
      onClick={() => setEditing(true)}
    >
      {value || t('点击选择产品大类')}
    </button>
  );
}

export function InlineStringList({
  addLabel,
  itemKey = 'value',
  label,
  path,
  placeholder,
}: InlineStringListProps) {
  const t = useAdminText();
  const { addRow, removeRow, rows, setRowField } =
    usePayloadFieldArray<Record<string, unknown>>(path);
  const fallbackKeys = [itemKey, 'value', 'title', 'label', 'description'];
  const [newRowIndex, setNewRowIndex] = useState<number | null>(null);
  const startNewRow = () => {
    setNewRowIndex(rows.length);
    addRow({ [itemKey]: '' });
  };

  return (
    <div className="ype-inline-list" data-ype-path={path}>
      <div className="ype-inline-list-head">
        <strong>{t(label)}</strong>
      </div>
      {rows.map((row, index) => (
        <div className="ype-inline-list-row" key={rowKey(row, index)}>
          <InlineEditableText
            autoEdit={newRowIndex === index}
            label={`${t(label)} ${index + 1}`}
            value={rowText(row, fallbackKeys)}
            placeholder={placeholder ? t(placeholder) : undefined}
            onBlur={() => {
              if (newRowIndex === index) {
                if (!rowHasText(row, fallbackKeys)) {
                  removeRow(index);
                }
                setNewRowIndex(null);
              }
            }}
            onChange={(value) => setRowField(index, itemKey, value)}
          />
          <button type="button" onClick={() => removeRow(index)}>
            {t('删除')}
          </button>
        </div>
      ))}
      <button type="button" className="ype-click-edit is-empty is-ghost" onClick={startNewRow}>
        {addLabel ? t(addLabel) : t({ en: `Add ${t(label)}`, zh: `点击填写${label}` })}
      </button>
    </div>
  );
}

export function InlineCardList({
  addLabel,
  descriptionKey = 'text',
  descriptionLabel,
  path,
  titleLabel,
}: InlineCardListProps) {
  const t = useAdminText();
  const { addRow, removeRow, rows, setRowField } =
    usePayloadFieldArray<Record<string, unknown>>(path);
  const [newRow, setNewRow] = useState<{
    field: 'description' | 'title';
    index: number;
  } | null>(null);
  const rowKeys = ['title', 'label', descriptionKey, 'description', 'text'];
  const startNewRow = (field: 'description' | 'title') => {
    setNewRow({ field, index: rows.length });
    addRow({ [descriptionKey]: '', title: '' });
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
    if (!rowHasText(row, rowKeys)) {
      removeRow(index);
    }
    setNewRow(null);
  };

  return (
    <div className="ype-inline-card-list" data-ype-path={path}>
      <div className="ype-inline-list-head">
        <strong>{t(addLabel)}</strong>
      </div>
      {rows.map((row, index) => (
        <article
          className="ype-inline-card-row"
          key={rowKey(row, index)}
          onBlur={(event) => removeUnusedNewRow(index, row, event)}
        >
          <InlineRowTextInput
            autoEdit={newRow?.index === index && newRow.field === 'title'}
            label={t(titleLabel)}
            placeholder={t({ en: `Add ${t(titleLabel)}`, zh: `点击填写${titleLabel}` })}
            value={rowText(row, ['title', 'label'])}
            onChange={(value) => setRowField(index, 'title', value)}
          />
          <InlineRowTextarea
            autoEdit={newRow?.index === index && newRow.field === 'description'}
            label={t(descriptionLabel)}
            placeholder={t({ en: `Add ${t(descriptionLabel)}`, zh: `点击填写${descriptionLabel}` })}
            value={rowText(row, [descriptionKey, 'description', 'text'])}
            onChange={(value) => setRowField(index, descriptionKey, value)}
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
          onClick={() => startNewRow('title')}
        >
          {t({ en: `Add ${t(titleLabel)}`, zh: `点击填写${titleLabel}` })}
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty is-multiline"
          onClick={() => startNewRow('description')}
        >
          {t({ en: `Add ${t(descriptionLabel)}`, zh: `点击填写${descriptionLabel}` })}
        </button>
      </article>
    </div>
  );
}

export function InlineRowTextInput({
  autoEdit = false,
  label,
  onChange,
  placeholder,
  value,
}: Readonly<{
  autoEdit?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}>) {
  const t = useAdminText();

  return (
    <span className="ype-inline-field">
      <span>{t(label)}</span>
      <InlineEditableText
        autoEdit={autoEdit}
        label={t(label)}
        value={value}
        placeholder={placeholder ? t(placeholder) : undefined}
        onChange={onChange}
      />
    </span>
  );
}

export function InlineRowTextarea({
  autoEdit = false,
  label,
  onChange,
  placeholder,
  value,
}: Readonly<{
  autoEdit?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}>) {
  const t = useAdminText();

  return (
    <span className="ype-inline-field">
      <span>{t(label)}</span>
      <InlineEditableText
        autoEdit={autoEdit}
        label={t(label)}
        multiline
        rows={3}
        value={value}
        placeholder={placeholder ? t(placeholder) : undefined}
        onChange={onChange}
      />
    </span>
  );
}
