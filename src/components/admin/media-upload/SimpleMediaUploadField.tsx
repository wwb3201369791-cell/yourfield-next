'use client';

import { useConfig, useField, useLocale } from '@payloadcms/ui';
import type { UploadFieldClientProps, Validate } from 'payload';
import { upload as validateUpload } from 'payload/shared';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAdminText, type AdminBilingualText } from '../adminUiLocale';

import {
  buildMediaUploadAltText,
  formatMediaFileSize,
  getMediaPreviewUrl,
  inferMediaFolder,
  normalizeMediaUploadError,
  type AdminMediaDoc,
  type MediaUploadKind,
} from './mediaUploadUtils';

type SimpleMediaUploadFieldConfig = UploadFieldClientProps['field'] & {
  custom?: {
    mediaKind?: MediaUploadKind;
  };
};

type SimpleMediaUploadFieldProps = Omit<UploadFieldClientProps, 'field'> & {
  field: SimpleMediaUploadFieldConfig;
};

function mediaId(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const id = (value as { id?: number | string }).id;
    return typeof id === 'number' || typeof id === 'string' ? id : undefined;
  }

  return undefined;
}

function labelToText(
  label: SimpleMediaUploadFieldConfig['label'],
  fallbackName: string,
): AdminBilingualText {
  if (typeof label === 'string' && label.trim()) {
    return label;
  }

  if (label && typeof label === 'object' && !Array.isArray(label)) {
    return label as AdminBilingualText;
  }

  return fallbackName.trim() || '媒体';
}

function isEmptyUploadValue(value: unknown) {
  return (
    value === null ||
    typeof value === 'undefined' ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function inferMediaKindFromText(...values: Array<string | undefined>) {
  const text = values.filter(Boolean).join(' ').toLowerCase();

  return /(?:video|视频|видео)/i.test(text) ? 'video' : 'image';
}

function resolveMediaKind({
  customMediaKind,
  fieldLabel,
  name,
  path,
}: {
  customMediaKind: MediaUploadKind | undefined;
  fieldLabel: string;
  name?: string;
  path: string;
}): MediaUploadKind {
  if (customMediaKind === 'video' || customMediaKind === 'image') {
    return customMediaKind;
  }

  return inferMediaKindFromText(name, path, fieldLabel);
}

function hasUploadRelationMetadata(
  options: Parameters<Validate>[1] & { relationTo?: SimpleMediaUploadFieldConfig['relationTo'] },
) {
  const collections = (
    options.req?.payload as { collections?: Record<string, unknown> } | undefined
  )?.collections;

  if (!collections) {
    return false;
  }

  if (typeof options.relationTo === 'string') {
    return Boolean(collections[options.relationTo]);
  }

  if (Array.isArray(options.relationTo)) {
    return options.relationTo.every((collectionSlug) => Boolean(collections[collectionSlug]));
  }

  return true;
}

async function uploadMedia({
  apiBase,
  file,
  folder,
  fallbackError,
  label,
  locale,
  mediaKind,
}: {
  apiBase: string;
  file: File;
  folder: string;
  fallbackError: string;
  label: string;
  locale: string;
  mediaKind: MediaUploadKind;
}) {
  const formData = new FormData();

  formData.append(
    '_payload',
    JSON.stringify({
      alt: buildMediaUploadAltText({ fileName: file.name, locale, mediaKind, title: label }),
      folder,
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
    doc?: AdminMediaDoc;
    errors?: Array<{ message?: string }>;
    message?: string;
  } | null;

  if (!response.ok || !result?.doc) {
    throw new Error(
      normalizeMediaUploadError(
        result?.errors?.[0]?.message || result?.message,
        fallbackError,
        mediaKind,
      ),
    );
  }

  return result.doc;
}

export default function SimpleMediaUploadField(props: SimpleMediaUploadFieldProps) {
  const t = useAdminText();
  const { field, path, readOnly: formReadOnly, validate = validateUpload as Validate } = props;
  const {
    admin: { description, readOnly: fieldReadOnly, style, width } = {},
    custom,
    label,
    name,
    relationTo,
    required,
  } = field;
  const {
    config: { routes, serverURL },
  } = useConfig();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<AdminMediaDoc | undefined>();
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const isReadOnly = Boolean(formReadOnly || fieldReadOnly);

  const memoizedValidate = useCallback(
    (value: unknown, options: Parameters<Validate>[1]) => {
      const validateOptions =
        required === undefined ? { ...options, relationTo } : { ...options, relationTo, required };

      if (validateOptions.required && isEmptyUploadValue(value)) {
        return validateOptions.req?.t?.('validation:required') ?? 'This field is required.';
      }

      if (!hasUploadRelationMetadata(validateOptions)) {
        return true;
      }

      return (
        validate as (value: unknown, options: Parameters<Validate>[1]) => ReturnType<Validate>
      )(value, validateOptions);
    },
    [relationTo, required, validate],
  );
  const { errorMessage, setValue, showError, value } = useField<number | string | null>({
    path,
    validate: memoizedValidate,
  });
  const selectedId = mediaId(value);
  const apiBase = `${serverURL ?? ''}${routes.api}`;
  const fieldLabel = t(labelToText(label, name || path));
  const mediaKind = resolveMediaKind({
    customMediaKind: custom?.mediaKind,
    fieldLabel,
    name,
    path,
  });
  const isVideoUpload = mediaKind === 'video';
  const previewUrl = getMediaPreviewUrl(media);
  const fileMeta = useMemo(
    () =>
      [
        formatMediaFileSize(media?.filesize),
        media?.width && media?.height ? `${media.width}x${media.height}` : '',
        media?.mimeType,
      ]
        .filter(Boolean)
        .join(' · '),
    [media?.filesize, media?.height, media?.mimeType, media?.width],
  );

  useEffect(() => {
    if (!selectedId || relationTo !== 'media') {
      setMedia(undefined);
      return undefined;
    }

    const controller = new AbortController();

    void fetch(`${apiBase}/media/${selectedId}?depth=0`, {
      credentials: 'include',
      headers: {
        'Accept-Language': locale?.code ?? 'zh',
      },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((doc: AdminMediaDoc | null) => {
        if (doc) {
          setMedia(doc);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [apiBase, locale?.code, relationTo, selectedId]);

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!file) {
      return;
    }

    const isAcceptedFile = isVideoUpload
      ? file.type === 'video/mp4' || /\.mp4$/i.test(file.name)
      : file.type.startsWith('image/');

    if (!isAcceptedFile) {
      setUploadError(
        t(isVideoUpload ? '请选择 MP4 视频。' : '请选择 JPG、PNG、WebP 或 GIF 图片。'),
      );
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      const uploadedMedia = await uploadMedia({
        apiBase,
        fallbackError: t(
          isVideoUpload
            ? '上传失败，请检查视频大小和格式后重试。'
            : '上传失败，请检查图片大小和格式后重试。',
        ),
        file,
        folder: isVideoUpload ? 'video' : inferMediaFolder(path),
        label: fieldLabel,
        locale: locale?.code ?? 'zh',
        mediaKind,
      });
      setMedia(uploadedMedia);
      setValue(uploadedMedia.id ?? null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('上传失败，请稍后重试。'));
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    setMedia(undefined);
    setUploadError('');
    setValue(null);
  };

  return (
    <div className="simple-media-upload field-type upload" style={{ ...style, width }}>
      <div className="simple-media-upload__label-row">
        <label className="field-label" htmlFor={`field-${path.replace(/\./g, '__')}`}>
          {fieldLabel}
          {required ? <span className="required">*</span> : null}
        </label>
        <button
          type="button"
          disabled={isReadOnly || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {media
            ? uploading
              ? t('上传中…')
              : t(isVideoUpload ? '更换视频' : '更换图片')
            : uploading
              ? t('上传中…')
              : t(isVideoUpload ? '选择视频' : '选择图片')}
        </button>
      </div>
      {description ? (
        <p className="simple-media-upload__description">{t(description as AdminBilingualText)}</p>
      ) : null}
      <input
        id={`field-${path.replace(/\./g, '__')}`}
        ref={inputRef}
        accept={isVideoUpload ? 'video/mp4' : 'image/gif,image/jpeg,image/png,image/webp'}
        disabled={isReadOnly || uploading}
        type="file"
        onChange={(event) => {
          void onFileSelected(event);
        }}
      />
      {media ? (
        <div className="simple-media-upload__selected">
          <div className="simple-media-upload__preview">
            {previewUrl && isVideoUpload ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption -- Admin previews use muted source media only for selection confirmation.
              <video src={previewUrl} muted controls preload="metadata" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Payload admin preview uses uploaded media URLs directly.
              <img src={previewUrl} alt={media.filename || fieldLabel} />
            ) : (
              <span>{t(isVideoUpload ? '视频' : '图片')}</span>
            )}
          </div>
          <div className="simple-media-upload__meta">
            <strong>{media.filename || t(isVideoUpload ? '已选择视频' : '已选择图片')}</strong>
            {fileMeta ? <span>{fileMeta}</span> : null}
          </div>
          {!isReadOnly ? (
            <button type="button" className="simple-media-upload__remove" onClick={removeMedia}>
              {t('移除')}
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="simple-media-upload__empty"
          disabled={isReadOnly || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {t(isVideoUpload ? '从本地选择一个视频' : '从本地选择一张图片')}
        </button>
      )}
      {showError && errorMessage ? (
        <p className="simple-media-upload__error">{errorMessage}</p>
      ) : null}
      {uploadError ? <p className="simple-media-upload__error">{uploadError}</p> : null}
    </div>
  );
}
