import { env } from '../env';

export const bytesPerMiB = 1024 * 1024;

export type MediaUploadKind = 'image' | 'pdf' | 'video';

export type MediaUploadLimit = Readonly<{
  kind: MediaUploadKind;
  maxBytes: number;
}>;

export type MediaUploadFile = Readonly<{
  mimetype?: string;
  size?: number;
}>;

export type MediaUploadLimitViolation = Readonly<{
  actualBytes: number;
  kind: MediaUploadKind;
  maxBytes: number;
}>;

export const mediaUploadLimits = {
  image: {
    kind: 'image',
    maxBytes: env.MEDIA_UPLOAD_IMAGE_MAX_BYTES,
  },
  pdf: {
    kind: 'pdf',
    maxBytes: env.MEDIA_UPLOAD_PDF_MAX_BYTES,
  },
  video: {
    kind: 'video',
    maxBytes: env.MEDIA_UPLOAD_VIDEO_MAX_BYTES,
  },
} as const satisfies Record<MediaUploadKind, MediaUploadLimit>;

export const maxConfiguredMediaUploadBytes = Math.max(
  mediaUploadLimits.image.maxBytes,
  mediaUploadLimits.pdf.maxBytes,
  mediaUploadLimits.video.maxBytes,
);

export function getMediaUploadLimitForMimeType(mimeType: string | undefined) {
  if (!mimeType) {
    return undefined;
  }

  if (mimeType.startsWith('image/')) {
    return mediaUploadLimits.image;
  }

  if (mimeType === 'application/pdf') {
    return mediaUploadLimits.pdf;
  }

  if (mimeType === 'video/mp4') {
    return mediaUploadLimits.video;
  }

  return undefined;
}

export function findMediaUploadLimitViolation(
  file: MediaUploadFile | undefined,
): MediaUploadLimitViolation | undefined {
  const limit = getMediaUploadLimitForMimeType(file?.mimetype);

  if (!limit || typeof file?.size !== 'number' || !Number.isFinite(file.size)) {
    return undefined;
  }

  if (file.size <= limit.maxBytes) {
    return undefined;
  }

  return {
    actualBytes: file.size,
    kind: limit.kind,
    maxBytes: limit.maxBytes,
  };
}

export function formatMediaUploadLimit(bytes: number) {
  const mib = bytes / bytesPerMiB;
  return `${Number.isInteger(mib) ? mib : mib.toFixed(1)} MB`;
}
