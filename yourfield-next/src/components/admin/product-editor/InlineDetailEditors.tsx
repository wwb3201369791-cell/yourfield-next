'use client';

import { useField } from 'payload/components/forms';
import { useLocale } from 'payload/components/utilities';
import RelationshipField from 'payload/dist/admin/components/forms/field-types/Relationship';
import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React, { useEffect, useRef, useState } from 'react';

import { SizeGuideDrawer } from './drawers/SizeGuideDrawer';
import { usePayloadFieldArray } from './hooks/usePayloadFieldArray';
import { uploadProductImage } from './hooks/useProductImageArrayUpload';
import {
  getMediaOriginalUrl,
  getMediaPreviewUrl,
  type ProductImageMedia,
} from './utils/productImageUpload';

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

type VisualGroupImageRow = Record<string, unknown> & {
  file?: ProductImageMedia | number | string | null;
};

type VisualGroupRow = Record<string, unknown> & {
  description?: string;
  images?: VisualGroupImageRow[];
  title?: string;
  variant?: string;
};

type VisualUploadTarget = Readonly<{
  description: string;
  title: string;
  variant: 'model' | 'modeling' | 'scene';
}>;

const visualUploadTargets: readonly VisualUploadTarget[] = [
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

function textFromUnknown(value: unknown): string {
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

function rowText(row: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = textFromUnknown(row[key]);
    if (value.trim()) {
      return value;
    }
  }

  return '';
}

function rowKey(row: Record<string, unknown>, index: number) {
  return typeof row.id === 'string' && row.id ? row.id : `${index}`;
}

function isProductImageMedia(value: unknown): value is ProductImageMedia {
  return Boolean(value && typeof value === 'object');
}

function imageMediaId(value: VisualGroupImageRow['file']) {
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

function imageUrlFromVisualRow(
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

function rowHasText(row: Record<string, unknown>, keys: readonly string[]) {
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

function InlineEditableText({
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
  const [editing, setEditing] = useState(autoEdit);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const displayValue = value.trim();
  const isEmpty = !displayValue;
  const displayText = displayValue || placeholder || `点击填写${label}`;

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
        aria-label={label}
        className={`ype-click-edit-input ${className}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onBlur={stopEditing}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      aria-label={label}
      className={`ype-click-edit-input ${className}`}
      type="text"
      value={value}
      placeholder={placeholder}
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
  const { setValue, value } = useField<string | Record<string, unknown>>({ path });
  const inputValue = textFromUnknown(value);

  return (
    <span className={`ype-inline-field ${className}`} data-ype-path={path}>
      <span className={hideLabel ? 'ype-visually-hidden' : undefined}>{label}</span>
      <InlineEditableText
        label={label}
        multiline={multiline}
        rows={rows}
        value={inputValue}
        placeholder={placeholder}
        onChange={setValue}
      />
    </span>
  );
}

export function InlineProductGroupField({ value }: Readonly<{ value: string }>) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="ype-inline-relationship-edit" data-ype-path="productGroup">
        <RelationshipField
          label="类别"
          name="productGroup"
          path="productGroup"
          relationTo="product-groups"
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
      {value || '点击选择产品大类'}
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
        <strong>{label}</strong>
      </div>
      {rows.map((row, index) => (
        <div className="ype-inline-list-row" key={rowKey(row, index)}>
          <InlineEditableText
            autoEdit={newRowIndex === index}
            label={`${label} ${index + 1}`}
            value={rowText(row, fallbackKeys)}
            placeholder={placeholder}
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
            删除
          </button>
        </div>
      ))}
      <button type="button" className="ype-click-edit is-empty is-ghost" onClick={startNewRow}>
        {addLabel ?? `点击填写${label}`}
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
        <strong>{addLabel}</strong>
      </div>
      {rows.map((row, index) => (
        <article
          className="ype-inline-card-row"
          key={rowKey(row, index)}
          onBlur={(event) => removeUnusedNewRow(index, row, event)}
        >
          <InlineRowTextInput
            autoEdit={newRow?.index === index && newRow.field === 'title'}
            label={titleLabel}
            placeholder={`点击填写${titleLabel}`}
            value={rowText(row, ['title', 'label'])}
            onChange={(value) => setRowField(index, 'title', value)}
          />
          <InlineRowTextarea
            autoEdit={newRow?.index === index && newRow.field === 'description'}
            label={descriptionLabel}
            placeholder={`点击填写${descriptionLabel}`}
            value={rowText(row, [descriptionKey, 'description', 'text'])}
            onChange={(value) => setRowField(index, descriptionKey, value)}
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
          点击填写{titleLabel}
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty is-multiline"
          onClick={() => startNewRow('description')}
        >
          点击填写{descriptionLabel}
        </button>
      </article>
    </div>
  );
}

function InlineRowTextInput({
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
  return (
    <span className="ype-inline-field">
      <span>{label}</span>
      <InlineEditableText
        autoEdit={autoEdit}
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </span>
  );
}

function InlineRowTextarea({
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
  return (
    <span className="ype-inline-field">
      <span>{label}</span>
      <InlineEditableText
        autoEdit={autoEdit}
        label={label}
        multiline
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </span>
  );
}

export function InlineProductIntroEditor() {
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>商品介绍</h2>
      </div>
      <InlineTextField
        label="概述"
        path="description"
        multiline
        rows={4}
        placeholder="输入产品概述，会同步显示在详情页商品介绍和首屏简介。"
      />
      <div className="ype-inline-grid">
        <InlineStringList label="材料" path="materials" placeholder="例如：阻燃面料" />
        <InlineStringList
          itemKey="title"
          label="产品特点"
          path="features"
          placeholder="例如：耐磨、轻量、透气"
        />
        <InlineStringList label="适用场景" path="applications" placeholder="例如：消防救援" />
      </div>
    </section>
  );
}

export function InlineSellingPointsEditor() {
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>核心卖点</h2>
      </div>
      <InlineCardList
        addLabel="核心卖点"
        descriptionLabel="说明"
        path="sellingPoints"
        titleLabel="卖点标题"
      />
    </section>
  );
}

export function InlineSpecTableEditor() {
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
        <h2>参数规格</h2>
      </div>
      <div className="ype-inline-list-head">
        <strong>参数表</strong>
      </div>
      {rows.map((row, index) => (
        <div
          className="ype-inline-spec-row"
          key={rowKey(row, index)}
          onBlur={(event) => removeUnusedNewRow(index, row, event)}
        >
          <InlineEditableText
            autoEdit={newRow?.index === index && newRow.field === 'label'}
            label={`参数名 ${index + 1}`}
            value={rowText(row, ['label'])}
            placeholder="参数名"
            onChange={(value) => setRowField(index, 'label', value)}
          />
          <InlineEditableText
            autoEdit={newRow?.index === index && newRow.field === 'value'}
            label={`参数值 ${index + 1}`}
            value={rowText(row, ['value'])}
            placeholder="参数值"
            onChange={(value) => setRowField(index, 'value', value)}
          />
          <button type="button" onClick={() => removeRow(index)}>
            删除
          </button>
        </div>
      ))}
      <div className="ype-inline-spec-row ype-inline-spec-row--ghost">
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('label')}
        >
          点击填写参数名
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('value')}
        >
          点击填写参数值
        </button>
      </div>
    </section>
  );
}

export function InlineScenariosEditor() {
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>适用场景</h2>
      </div>
      <InlineCardList
        addLabel="场景卡片"
        descriptionKey="description"
        descriptionLabel="场景说明"
        path="scenarios"
        titleLabel="场景标题"
      />
      <InlineStringList
        label="适用场景文本"
        path="applications"
        placeholder="没有卡片时，也可以先填一句场景文本。"
      />
    </section>
  );
}

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

export function InlineCareEditor() {
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>洗护与维护</h2>
      </div>
      <InlineStringList label="洗护说明" path="careInstructions" placeholder="输入一条洗护说明" />
    </section>
  );
}

export function InlineSizeGuideEditor() {
  return <SizeGuideDrawer />;
}

export function InlineVisualGroupsEditor() {
  const { rows, setRows } = usePayloadFieldArray<VisualGroupRow>('visualGroups');
  const { value: productNameValue } = useField<string>({ path: 'name' });
  const { routes, serverURL } = useConfig();
  const locale = useLocale();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [error, setError] = useState('');
  const [resolvedMedia, setResolvedMedia] = useState<Record<string, ProductImageMedia>>({});
  const [uploadingVariant, setUploadingVariant] = useState<VisualUploadTarget['variant'] | null>(
    null,
  );
  const apiBase = `${serverURL ?? ''}${routes.api}`;
  const localeCode = locale?.code ?? 'zh';
  const productName = typeof productNameValue === 'string' ? productNameValue : '';

  useEffect(() => {
    const controller = new AbortController();
    const unresolvedIds = rows
      .flatMap((row) => (Array.isArray(row.images) ? row.images : []))
      .map((image) => imageMediaId(image.file))
      .filter((id): id is number | string => Boolean(id) && !resolvedMedia[String(id)]);

    if (unresolvedIds.length === 0) {
      return () => controller.abort();
    }

    void Promise.all(
      unresolvedIds.map(async (id) => {
        const response = await fetch(`${apiBase}/media/${id}?depth=0`, {
          credentials: 'include',
          headers: {
            'Accept-Language': localeCode,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          return null;
        }

        const media = (await response.json()) as ProductImageMedia;
        return { id: String(id), media };
      }),
    )
      .then((items) => {
        const next = items.reduce<Record<string, ProductImageMedia>>((acc, item) => {
          if (item?.media) {
            acc[item.id] = item.media;
          }
          return acc;
        }, {});

        if (Object.keys(next).length > 0) {
          setResolvedMedia((current) => ({ ...current, ...next }));
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [apiBase, localeCode, resolvedMedia, rows]);

  const findGroupIndex = (target: VisualUploadTarget) =>
    rows.findIndex((row) => row.variant === target.variant || row.title === target.title);

  const updateTargetImages = (
    target: VisualUploadTarget,
    updater: (images: VisualGroupImageRow[]) => VisualGroupImageRow[],
  ) => {
    const groupIndex = findGroupIndex(target);
    const nextRows = [...rows];
    const currentRow =
      groupIndex >= 0
        ? nextRows[groupIndex]
        : {
            description: target.description,
            images: [],
            title: target.title,
            variant: target.variant,
          };

    const currentImages = Array.isArray(currentRow?.images) ? currentRow.images : [];
    const nextRow: VisualGroupRow = {
      ...currentRow,
      description: textFromUnknown(currentRow?.description) || target.description,
      images: updater(currentImages),
      title: textFromUnknown(currentRow?.title) || target.title,
      variant: typeof currentRow?.variant === 'string' ? currentRow.variant : target.variant,
    };

    if (groupIndex >= 0) {
      nextRows[groupIndex] = nextRow;
    } else {
      nextRows.push(nextRow);
    }

    setRows(nextRows);
  };

  const uploadFilesToTarget = async (target: VisualUploadTarget, files: readonly File[]) => {
    if (files.length === 0) {
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));

    if (invalidFile) {
      setError('这里只能上传 JPG、PNG、WebP 或 GIF 图片。');
      return;
    }

    setError('');
    setUploadingVariant(target.variant);

    try {
      const uploadedRows: VisualGroupImageRow[] = [];

      for (const file of files) {
        const media = await uploadProductImage({
          apiBase,
          file,
          locale: localeCode,
          productName,
        });
        const fileValue = media.id ?? media;

        if (typeof media.id !== 'undefined') {
          setResolvedMedia((current) => ({ ...current, [String(media.id)]: media }));
        }

        uploadedRows.push({ file: fileValue });
      }

      updateTargetImages(target, (images) => [...images, ...uploadedRows]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败，请稍后重试。');
    } finally {
      setUploadingVariant(null);
    }
  };

  const imageCount = rows.reduce(
    (total, row) => total + (Array.isArray(row.images) ? row.images.length : 0),
    0,
  );

  return (
    <section className="ype-inline-editor ype-visual-upload-editor" data-ype-path="visualGroups">
      <div className="detail-section-heading">
        <h2>场景图、建模图与模特上身图</h2>
      </div>
      <div className="ype-visual-upload-summary">
        <strong>详情页图组</strong>
        <span>{imageCount} 张图</span>
      </div>
      <div className="ype-visual-upload-grid">
        {visualUploadTargets.map((target) => {
          const groupIndex = findGroupIndex(target);
          const row = groupIndex >= 0 ? rows[groupIndex] : undefined;
          const images = Array.isArray(row?.images) ? row.images : [];
          const uploading = uploadingVariant === target.variant;

          return (
            <article className="ype-visual-upload-card" key={target.variant}>
              <input
                ref={(input) => {
                  inputRefs.current[target.variant] = input;
                }}
                className="ype-hidden-file-input"
                type="file"
                accept="image/gif,image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = '';
                  void uploadFilesToTarget(target, files);
                }}
              />
              <div className="ype-visual-upload-head">
                <div>
                  <h3>{target.title}</h3>
                  <p>{target.description}</p>
                </div>
                <span>{images.length} 张</span>
              </div>
              <button
                type="button"
                className={`ype-visual-upload-drop ${images.length > 0 ? 'has-images' : 'is-empty'}`}
                disabled={uploading}
                onClick={() => inputRefs.current[target.variant]?.click()}
              >
                {images.length > 0 ? (
                  <span className="ype-visual-upload-thumbs">
                    {images.slice(0, 6).map((image, imageIndex) => {
                      const url = imageUrlFromVisualRow(image, resolvedMedia);

                      return (
                        <span
                          className="ype-visual-upload-thumb"
                          key={`${target.variant}-${imageIndex}`}
                        >
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- Payload admin preview uses just-uploaded media URLs.
                            <img src={url} alt={`${target.title} ${imageIndex + 1}`} />
                          ) : (
                            <span>{imageIndex + 1}</span>
                          )}
                        </span>
                      );
                    })}
                    {images.length > 6 ? (
                      <span className="ype-visual-upload-thumb ype-visual-upload-more">
                        +{images.length - 6}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="ype-visual-upload-empty">
                    <strong>点击添加{target.title}</strong>
                    <small>可一次选择多张图片</small>
                  </span>
                )}
              </button>
              {images.length > 0 ? (
                <div className="ype-visual-upload-actions">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => inputRefs.current[target.variant]?.click()}
                  >
                    继续添加图片
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateTargetImages(target, (currentImages) => currentImages.slice(0, -1))
                    }
                  >
                    删除最后一张
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {error ? <p className="ype-inline-upload-error">{error}</p> : null}
    </section>
  );
}

export function InlineFaqEditor() {
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
        <h2>常见问题</h2>
      </div>
      <div className="ype-inline-list-head">
        <strong>问答内容</strong>
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
            删除
          </button>
        </article>
      ))}
      <article className="ype-inline-card-row ype-inline-card-row--ghost">
        <button
          type="button"
          className="ype-click-edit is-empty"
          onClick={() => startNewRow('question')}
        >
          点击填写问题
        </button>
        <button
          type="button"
          className="ype-click-edit is-empty is-multiline"
          onClick={() => startNewRow('answer')}
        >
          点击填写答案
        </button>
      </article>
    </section>
  );
}
