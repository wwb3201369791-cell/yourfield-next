'use client';

import { useField } from 'payload/components/forms';
import { useLocale } from 'payload/components/utilities';
import RelationshipField from 'payload/dist/admin/components/forms/field-types/Relationship';
import React, { type ReactNode } from 'react';

import { useEditorContext } from '../hooks/useEditorContext';
import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';
import {
  productImageMediaId,
  productImageUrlFromRow,
  useProductImageArrayUpload,
} from '../hooks/useProductImageArrayUpload';
import { extractChineseOriginalPreview } from '../utils/productEditorPreflight';
import { getMediaPreviewUrl } from '../utils/productImageUpload';

type FieldSpec = Readonly<{
  help?: string;
  hasMany?: boolean;
  kind?: 'text' | 'textarea' | 'array' | 'readonly' | 'upload-array' | 'relationship';
  label: string;
  localized?: boolean;
  maxRows?: number;
  path: string;
  relationTo?: string;
}>;

type Props = Readonly<{
  description?: string;
  fields: readonly FieldSpec[];
  footer?: ReactNode;
  title: string;
}>;

function TextControl({ field }: { field: FieldSpec }) {
  const { setValue, value } = useField<string>({ path: field.path });

  if (field.kind === 'readonly') {
    return <pre className="ype-field-readonly">{JSON.stringify(value ?? null, null, 2)}</pre>;
  }

  const commonProps = {
    value: typeof value === 'string' ? value : '',
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(event.target.value),
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
        const value =
          typeof row.value === 'string'
            ? row.value
            : typeof row.title === 'string'
              ? row.title
              : '';
        return (
          <div className="ype-array-row" key={index}>
            <input
              value={value}
              onChange={(event) => setRowField(index, 'value', event.target.value)}
            />
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

function UploadArrayControl({ field }: { field: FieldSpec }) {
  const uploadOptions = typeof field.maxRows === 'number' ? { maxRows: field.maxRows } : {};
  const {
    error,
    clearRows,
    inputRef,
    moveRow,
    onFilesSelected,
    openFileDialog,
    removeRow,
    resolveMediaForRow,
    rows,
    uploading,
  } = useProductImageArrayUpload(field.path, uploadOptions);
  const isSingleImage = field.maxRows === 1;
  const visibleRows = isSingleImage ? rows.slice(0, 1) : rows;

  return (
    <div className="ype-product-image-field">
      <div className="ype-product-image-head">
        <strong>{field.label}</strong>
        <button type="button" disabled={uploading} onClick={openFileDialog}>
          {uploading ? '上传中…' : isSingleImage && rows.length > 0 ? '更换主图' : '选择本地图片'}
        </button>
      </div>
      {field.help ? <p>{field.help}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/gif,image/jpeg,image/png,image/webp"
        multiple={!isSingleImage}
        onChange={onFilesSelected}
      />
      {rows.length > 0 ? (
        <div className="ype-product-image-list">
          {visibleRows.map((row, index) => {
            const id = productImageMediaId(row.file);
            const media = resolveMediaForRow(row);
            const previewUrl = getMediaPreviewUrl(media) || productImageUrlFromRow(row);
            const title = media?.filename || `产品图片 ${index + 1}`;

            return (
              <article className="ype-product-image-row" key={`${id ?? previewUrl}-${index}`}>
                <div className="ype-product-image-preview">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Payload admin preview uses uploaded media URLs directly.
                    <img src={previewUrl} alt={title} />
                  ) : (
                    <span>图片</span>
                  )}
                </div>
                <div className="ype-product-image-meta">
                  <strong>{isSingleImage || index === 0 ? '主图' : `展示图 ${index + 1}`}</strong>
                  <span>{title}</span>
                </div>
                <div className="ype-product-image-actions">
                  {isSingleImage ? null : (
                    <>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveRow(index, index - 1)}
                      >
                        上移
                      </button>
                      <button
                        type="button"
                        disabled={index === rows.length - 1}
                        onClick={() => moveRow(index, index + 1)}
                      >
                        下移
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => (isSingleImage ? clearRows() : removeRow(index))}
                  >
                    删除
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ype-product-image-empty">还没有产品图片，点击上方按钮从本地选择图片。</div>
      )}
      {error ? <p className="ype-product-image-error">{error}</p> : null}
    </div>
  );
}

function RelationshipControl({ field }: { field: FieldSpec }) {
  if (!field.relationTo) {
    return <p className="ype-field-help">缺少关系字段配置。</p>;
  }

  const adminProps = field.help ? { admin: { description: field.help } } : {};
  const relationshipProps = typeof field.hasMany === 'boolean' ? { hasMany: field.hasMany } : {};

  return (
    <div className="ype-native-field">
      <RelationshipField
        {...adminProps}
        {...relationshipProps}
        label={field.label}
        name={field.path}
        path={field.path}
        relationTo={field.relationTo}
      />
    </div>
  );
}

function ChineseOriginalHint({ field }: { field: FieldSpec }) {
  const locale = useLocale();
  const { allLocaleDoc } = useEditorContext();
  const currentLocale = locale?.code ?? 'zh';

  if (currentLocale === 'zh' || field.localized === false) {
    return null;
  }

  const preview = extractChineseOriginalPreview(allLocaleDoc, field.path);

  if (!preview) {
    return null;
  }

  return (
    <span className="ype-zh-original">
      看中文原文
      <span role="tooltip">{preview}</span>
    </span>
  );
}

function FieldControl({ field }: { field: FieldSpec }) {
  if (field.kind === 'upload-array') {
    return <UploadArrayControl field={field} />;
  }

  if (field.kind === 'relationship') {
    return <RelationshipControl field={field} />;
  }

  return field.kind === 'array' ? <ArrayControl field={field} /> : <TextControl field={field} />;
}

export function SectionFieldDrawer({ description, fields, footer, title }: Props) {
  return (
    <section className="ype-field-drawer">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {fields.map((field) => {
        const isNativeField = field.kind === 'upload-array' || field.kind === 'relationship';

        return isNativeField ? (
          <div className="ype-field ype-field--native" data-ype-path={field.path} key={field.path}>
            <FieldControl field={field} />
          </div>
        ) : (
          <label className="ype-field" data-ype-path={field.path} key={field.path}>
            <span className="ype-field-label">
              <span>{field.label}</span>
              <ChineseOriginalHint field={field} />
            </span>
            <FieldControl field={field} />
            {field.help ? <small>{field.help}</small> : null}
          </label>
        );
      })}
      {footer ? <div className="ype-field-footer">{footer}</div> : null}
      <p className="ype-field-help">
        富文本、复杂嵌套图组等字段仍可通过经典表单使用 Payload 原生控件编辑。
      </p>
    </section>
  );
}
