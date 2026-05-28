'use client';

import React, { useMemo } from 'react';

import {
  getMediaPreviewUrl,
  type AdminMediaDoc,
} from '@/components/admin/media-upload/mediaUploadUtils';

import { useFormValues } from '../utils/buildProductFromForm';

type VisualGroupImageSummary = Readonly<{
  label: string;
  previewUrl: string;
}>;

type VisualGroupSummary = Readonly<{
  description: string;
  images: readonly VisualGroupImageSummary[];
  title: string;
  variantLabel: string;
}>;

const variantLabels: Record<string, string> = {
  certificate: '认证资料',
  comparison: '对比图',
  detail: '细节图',
  gallery: '产品图册',
  model: '模特上身图',
  modeling: '建模图',
  scene: '场景图',
};

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  if (typeof record.value === 'string') {
    return record.value.trim();
  }
  if (typeof record.label === 'string') {
    return record.label.trim();
  }
  if (typeof record.title === 'string') {
    return record.title.trim();
  }

  for (const locale of ['zh', 'en', 'ru']) {
    if (typeof record[locale] === 'string' && record[locale].trim()) {
      return record[locale].trim();
    }
  }

  return '';
}

function isMediaDoc(value: unknown): value is AdminMediaDoc {
  return Boolean(value && typeof value === 'object');
}

function fileNameFromUrl(url: string) {
  const fileName = url.split('/').filter(Boolean).at(-1) ?? '产品图片';

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function imageSummaryFromRow(value: unknown, index: number): VisualGroupImageSummary | null {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const file = record.file ?? value;

  if (typeof file === 'string') {
    return {
      label: fileNameFromUrl(file),
      previewUrl: file.startsWith('/') || file.startsWith('http') ? file : '',
    };
  }

  if (typeof file === 'number') {
    return {
      label: `图片 ${index + 1}`,
      previewUrl: '',
    };
  }

  if (isMediaDoc(file)) {
    const previewUrl = getMediaPreviewUrl(file);

    return {
      label: file.filename ?? (previewUrl ? fileNameFromUrl(previewUrl) : `图片 ${index + 1}`),
      previewUrl,
    };
  }

  return null;
}

function visualGroupsFromValues(value: unknown): readonly VisualGroupSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((row, index) => {
    const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const variant = typeof record.variant === 'string' ? record.variant : 'gallery';
    const images = Array.isArray(record.images)
      ? record.images
          .map((image, imageIndex) => imageSummaryFromRow(image, imageIndex))
          .filter((image): image is VisualGroupImageSummary => Boolean(image))
      : [];

    return {
      description: textFromUnknown(record.description),
      images,
      title: textFromUnknown(record.title) || `图组 ${index + 1}`,
      variantLabel: variantLabels[variant] ?? '产品图册',
    };
  });
}

function openClassicForm() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('view', 'classic');
  window.location.href = `${url.pathname}${url.search}${url.hash}`;
}

export function VisualGroupsDrawer() {
  const values = useFormValues();
  const groups = useMemo(() => visualGroupsFromValues(values.visualGroups), [values]);
  const imageCount = groups.reduce((total, group) => total + group.images.length, 0);

  return (
    <section className="ype-field-drawer">
      <h2>场景图、建模图与模特上身图</h2>
      <p>维护详情页下方图组。当前抽屉先帮你核对图组结构和图片数量，前台预览会同步更新。</p>

      <div className="ype-visual-groups-summary" aria-live="polite">
        <strong>当前图组</strong>
        <span>
          {groups.length} 组 · {imageCount} 张图
        </span>
      </div>

      {groups.length > 0 ? (
        <div className="ype-visual-groups-list">
          {groups.map((group, index) => {
            const visibleImages = group.images.slice(0, 6);
            const hiddenCount = Math.max(group.images.length - visibleImages.length, 0);

            return (
              <article className="ype-visual-group-summary-card" key={`${group.title}-${index}`}>
                <div className="ype-visual-group-summary-head">
                  <div className="ype-visual-group-summary-title">
                    <span>{group.variantLabel}</span>
                    <h3>{group.title}</h3>
                  </div>
                  <strong className="ype-visual-group-count">{group.images.length} 张</strong>
                </div>
                {group.description ? <p>{group.description}</p> : null}
                {visibleImages.length > 0 ? (
                  <div className="ype-visual-thumb-grid" aria-label={`${group.title} 缩略图`}>
                    {visibleImages.map((image, imageIndex) => (
                      <span className="ype-visual-thumb" key={`${image.label}-${imageIndex}`}>
                        {image.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- Payload admin preview uses uploaded media URLs directly.
                          <img src={image.previewUrl} alt={image.label} />
                        ) : (
                          <span>{imageIndex + 1}</span>
                        )}
                      </span>
                    ))}
                    {hiddenCount > 0 ? (
                      <span className="ype-visual-thumb ype-visual-thumb-more">+{hiddenCount}</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="ype-visual-groups-empty">这个图组还没有添加图片。</div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ype-visual-groups-empty">
          当前还没有详情页图组。添加后，这里会按分组展示图片数量和缩略图。
        </div>
      )}

      <div className="ype-visual-groups-actions">
        <button type="button" className="ype-classic-link" onClick={openClassicForm}>
          打开经典表单编辑图组
        </button>
      </div>
      <p className="ype-field-help">
        新增、删除、排序或上传分组图片仍使用经典表单里的“详情页图组”；本页用于快速预览和检查前台呈现。
      </p>
    </section>
  );
}
