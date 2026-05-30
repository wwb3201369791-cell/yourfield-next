'use client';

import { useConfig, useField, useLocale } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

import { useAdminText } from '../../adminUiLocale';
import { usePayloadFieldArray } from '../hooks/usePayloadFieldArray';
import { uploadProductImage } from '../hooks/useProductImageArrayUpload';
import {
  imageMediaId,
  imageUrlFromVisualRow,
  textFromUnknown,
  type VisualGroupImageRow,
  type VisualGroupRow,
  type VisualUploadTarget,
  visualUploadTargets,
} from '../inline/InlineControls';
import { type ProductImageMedia } from '../utils/productImageUpload';

export function InlineVisualGroupsEditor() {
  const t = useAdminText();
  const { rows, setRows } = usePayloadFieldArray<VisualGroupRow>('visualGroups');
  const { value: productNameValue } = useField<string>({ path: 'name' });
  const {
    config: { routes, serverURL },
  } = useConfig();
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
      setError(
        t({
          en: 'Only JPG, PNG, WebP, or GIF images can be uploaded here.',
          zh: '这里只能上传 JPG、PNG、WebP 或 GIF 图片。',
        }),
      );
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
      setError(uploadError instanceof Error ? uploadError.message : t('上传失败，请稍后重试。'));
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
        <h2>{t('场景图、建模图与模特上身图')}</h2>
      </div>
      <div className="ype-visual-upload-summary">
        <strong>{t('详情页图组')}</strong>
        <span>{t({ en: `${imageCount} images`, zh: `${imageCount} 张图` })}</span>
      </div>
      <div className="ype-visual-upload-grid">
        {visualUploadTargets.map((target) => {
          const groupIndex = findGroupIndex(target);
          const row = groupIndex >= 0 ? rows[groupIndex] : undefined;
          const images = Array.isArray(row?.images) ? row.images : [];
          const uploading = uploadingVariant === target.variant;
          const targetTitle = t(target.title);

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
                  <h3>{targetTitle}</h3>
                  <p>{t(target.description)}</p>
                </div>
                <span>{t({ en: `${images.length} images`, zh: `${images.length} 张` })}</span>
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
                            <img src={url} alt={`${targetTitle} ${imageIndex + 1}`} />
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
                    <strong>
                      {t({ en: `Add ${targetTitle}`, zh: `点击添加${target.title}` })}
                    </strong>
                    <small>
                      {t({ en: 'Select multiple images at once', zh: '可一次选择多张图片' })}
                    </small>
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
                    {t({ en: 'Add more images', zh: '继续添加图片' })}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateTargetImages(target, (currentImages) => currentImages.slice(0, -1))
                    }
                  >
                    {t({ en: 'Delete last image', zh: '删除最后一张' })}
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
