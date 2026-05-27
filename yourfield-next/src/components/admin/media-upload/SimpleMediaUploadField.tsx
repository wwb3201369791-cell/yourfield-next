'use client';

import { useField } from 'payload/components/forms';
import { useLocale } from 'payload/components/utilities';
import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import { upload as validateUpload } from 'payload/dist/fields/validations';
import type { UploadField, Validate } from 'payload/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildMediaAltText,
  formatMediaFileSize,
  getMediaPreviewUrl,
  inferMediaFolder,
  type AdminMediaDoc,
} from './mediaUploadUtils';

type SimpleMediaUploadFieldProps = Omit<UploadField, 'type'> & {
  path: string;
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

function labelToText(label: SimpleMediaUploadFieldProps['label'], name: string) {
  return typeof label === 'string' && label.trim() ? label : name;
}

async function uploadMedia({
  apiBase,
  file,
  folder,
  label,
  locale,
}: {
  apiBase: string;
  file: File;
  folder: string;
  label: string;
  locale: string;
}) {
  const formData = new FormData();

  formData.append(
    '_payload',
    JSON.stringify({
      alt: buildMediaAltText({ fileName: file.name, title: label }),
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
      result?.errors?.[0]?.message || result?.message || '上传失败，请检查图片大小和格式后重试。',
    );
  }

  return result.doc;
}

export default function SimpleMediaUploadField(props: SimpleMediaUploadFieldProps) {
  const {
    admin: { condition, description, readOnly, style, width } = {},
    label,
    name,
    path,
    relationTo,
    required,
    validate = validateUpload as Validate,
  } = props;
  const { routes, serverURL } = useConfig();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<AdminMediaDoc | undefined>();
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const memoizedValidate = useCallback(
    (value: unknown, options: Parameters<Validate>[1]) =>
      validate(value, {
        ...options,
        required,
      }),
    [required, validate],
  );
  const { errorMessage, setValue, showError, value } = useField<number | string | null>({
    ...(condition ? { condition } : {}),
    path,
    validate: memoizedValidate,
  });
  const selectedId = mediaId(value);
  const apiBase = `${serverURL ?? ''}${routes.api}`;
  const fieldLabel = labelToText(label, name);
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

    if (!file.type.startsWith('image/')) {
      setUploadError('请选择 JPG、PNG、WebP 或 GIF 图片。');
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      const uploadedMedia = await uploadMedia({
        apiBase,
        file,
        folder: inferMediaFolder(path),
        label: fieldLabel,
        locale: locale?.code ?? 'zh',
      });
      setMedia(uploadedMedia);
      setValue(uploadedMedia.id ?? null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '上传失败，请稍后重试。');
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
          disabled={readOnly || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {media ? (uploading ? '上传中…' : '更换图片') : uploading ? '上传中…' : '选择图片'}
        </button>
      </div>
      {typeof description === 'string' ? (
        <p className="simple-media-upload__description">{description}</p>
      ) : null}
      <input
        id={`field-${path.replace(/\./g, '__')}`}
        ref={inputRef}
        accept="image/gif,image/jpeg,image/png,image/webp"
        disabled={readOnly || uploading}
        type="file"
        onChange={(event) => {
          void onFileSelected(event);
        }}
      />
      {media ? (
        <div className="simple-media-upload__selected">
          <div className="simple-media-upload__preview">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Payload admin preview uses uploaded media URLs directly.
              <img src={previewUrl} alt={media.filename || fieldLabel} />
            ) : (
              <span>图片</span>
            )}
          </div>
          <div className="simple-media-upload__meta">
            <strong>{media.filename || '已选择图片'}</strong>
            {fileMeta ? <span>{fileMeta}</span> : null}
          </div>
          {!readOnly ? (
            <button type="button" className="simple-media-upload__remove" onClick={removeMedia}>
              移除
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="simple-media-upload__empty"
          disabled={readOnly || uploading}
          onClick={() => inputRef.current?.click()}
        >
          从本地选择一张图片
        </button>
      )}
      {showError && errorMessage ? (
        <p className="simple-media-upload__error">{errorMessage}</p>
      ) : null}
      {uploadError ? <p className="simple-media-upload__error">{uploadError}</p> : null}
    </div>
  );
}
