'use client';

import { useConfig, useField, useLocale } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

import { normalizeMediaUploadError } from '../../media-upload/mediaUploadUtils';
import {
  buildProductImageAltText,
  getMediaOriginalUrl,
  getMediaPreviewUrl,
  type ProductImageMedia,
} from '../utils/productImageUpload';

import { usePayloadFieldArray } from './usePayloadFieldArray';

export type UploadImageRow = Record<string, unknown> & {
  file?: ProductImageMedia | number | string | null;
};

type ProductImageArrayUploadOptions = {
  maxRows?: number;
};

const imageUrlPattern =
  /^(https?:|\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)([?#].*)?$/i;

function isImageUrlText(value: string) {
  return imageUrlPattern.test(value.trim());
}

export function isProductImageMedia(value: UploadImageRow['file']): value is ProductImageMedia {
  return Boolean(value && typeof value === 'object');
}

function relationshipValueId(value: unknown): number | string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as { id?: unknown; value?: unknown };
  if (typeof record.id === 'number' || typeof record.id === 'string') {
    return record.id;
  }
  if (typeof record.value === 'number' || typeof record.value === 'string') {
    return record.value;
  }
  if (record.value && typeof record.value === 'object') {
    return relationshipValueId(record.value);
  }

  return undefined;
}

export function productImageMediaId(value: UploadImageRow['file']) {
  if (isProductImageMedia(value)) {
    return relationshipValueId(value);
  }

  if (typeof value === 'string') {
    return isImageUrlText(value) ? undefined : value;
  }

  return typeof value === 'number' ? value : undefined;
}

export function productImageUrlFromRow(
  row: UploadImageRow,
  resolvedMedia: Record<string, ProductImageMedia> = {},
) {
  const file = row.file;

  if (typeof file === 'string' && isImageUrlText(file)) {
    return file;
  }

  if (isProductImageMedia(file)) {
    return getMediaOriginalUrl(file) || getMediaPreviewUrl(file);
  }

  const id = productImageMediaId(file);

  return typeof id !== 'undefined'
    ? getMediaOriginalUrl(resolvedMedia[String(id)]) ||
        getMediaPreviewUrl(resolvedMedia[String(id)])
    : '';
}

export async function uploadProductImage({
  apiBase,
  file,
  locale,
  productName,
}: {
  apiBase: string;
  file: File;
  locale: string;
  productName: string;
}) {
  const formData = new FormData();

  formData.append(
    '_payload',
    JSON.stringify({
      alt: buildProductImageAltText({ fileName: file.name, locale, productName }),
      folder: 'products',
    }),
  );
  formData.append('file', file);

  const response = await fetch(`${apiBase}/media?depth=0`, {
    body: formData,
    credentials: 'include',
    headers: {
      'Accept-Language': locale,
    },
    method: 'POST',
  });

  const result = (await response.json().catch(() => null)) as {
    doc?: ProductImageMedia;
    errors?: Array<{ message?: string }>;
    message?: string;
  } | null;

  if (!response.ok || !result?.doc) {
    throw new Error(
      normalizeMediaUploadError(
        result?.errors?.[0]?.message || result?.message,
        '上传失败，请检查图片大小和格式后重试。',
      ),
    );
  }

  return result.doc;
}

export function useProductImageArrayUpload(
  path = 'images',
  options: ProductImageArrayUploadOptions = {},
) {
  const { addRow, clearRows, moveRow, removeRow, replaceRow, rows } =
    usePayloadFieldArray<UploadImageRow>(path);
  const { value: productNameValue } = useField<string>({ path: 'name' });
  const {
    config: { routes },
  } = useConfig();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [resolvedMedia, setResolvedMedia] = useState<Record<string, ProductImageMedia>>({});

  const apiBase = routes.api;
  const productName = typeof productNameValue === 'string' ? productNameValue : '';
  const localeCode = locale?.code ?? 'zh';

  useEffect(() => {
    const controller = new AbortController();
    const unresolvedIds = rows
      .map((row) => productImageMediaId(row.file))
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

  const imageUrls = useMemo(
    () => rows.map((row) => productImageUrlFromRow(row, resolvedMedia)).filter(Boolean),
    [resolvedMedia, rows],
  );

  const resolveMediaForRow = useCallback(
    (row: UploadImageRow) => {
      if (isProductImageMedia(row.file)) {
        return row.file;
      }

      const id = productImageMediaId(row.file);

      return typeof id !== 'undefined' ? resolvedMedia[String(id)] : undefined;
    },
    [resolvedMedia],
  );

  const uploadFiles = useCallback(
    async (files: readonly File[]) => {
      if (files.length === 0) {
        return;
      }

      const invalidFile = files.find((file) => !file.type.startsWith('image/'));

      if (invalidFile) {
        setError('产品图片只支持 JPG、PNG、WebP 或 GIF 图片。');
        return;
      }

      setError('');
      setUploading(true);

      try {
        const uploadQueue =
          typeof options.maxRows === 'number' && options.maxRows > 0
            ? files.slice(0, options.maxRows)
            : files;

        for (const file of uploadQueue) {
          const media = await uploadProductImage({
            apiBase,
            file,
            locale: localeCode,
            productName,
          });
          const id = media.id;

          if (typeof id !== 'undefined') {
            setResolvedMedia((current) => ({ ...current, [String(id)]: media }));
          }

          if (options.maxRows === 1) {
            if (rows.length > 0) {
              replaceRow(0, { file: id ?? media });
              for (let rowIndex = rows.length - 1; rowIndex >= 1; rowIndex -= 1) {
                removeRow(rowIndex);
              }
            } else {
              addRow({ file: id ?? media });
            }
            continue;
          }

          addRow({ file: id ?? media });
        }
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : '上传失败，请稍后重试。');
      } finally {
        setUploading(false);
      }
    },
    [addRow, apiBase, localeCode, options.maxRows, productName, removeRow, replaceRow, rows.length],
  );

  const onFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';

      void uploadFiles(files);
    },
    [uploadFiles],
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    addRow,
    clearRows,
    error,
    imageUrls,
    inputRef,
    moveRow,
    onFilesSelected,
    openFileDialog,
    removeRow,
    resolveMediaForRow,
    rows,
    setError,
    uploadFiles,
    uploading,
  };
}
