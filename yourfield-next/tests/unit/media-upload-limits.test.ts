import { describe, expect, it, vi } from 'vitest';

import { Media } from '@/collections/Media';
import {
  bytesPerMiB,
  findMediaUploadLimitViolation,
  formatMediaUploadLimit,
  getMediaUploadLimitForMimeType,
  maxConfiguredMediaUploadBytes,
  mediaUploadLimits,
} from '@/lib/media/uploadLimits';

describe('media upload limits', () => {
  it('uses P4 defaults for images, PDFs, and MP4 videos', () => {
    expect(mediaUploadLimits.image.maxBytes).toBe(10 * bytesPerMiB);
    expect(mediaUploadLimits.pdf.maxBytes).toBe(20 * bytesPerMiB);
    expect(mediaUploadLimits.video.maxBytes).toBe(100 * bytesPerMiB);
    expect(maxConfiguredMediaUploadBytes).toBe(100 * bytesPerMiB);
  });

  it('maps allowed media MIME types to their scoped limits', () => {
    expect(getMediaUploadLimitForMimeType('image/jpeg')).toBe(mediaUploadLimits.image);
    expect(getMediaUploadLimitForMimeType('image/svg+xml')).toBe(mediaUploadLimits.image);
    expect(getMediaUploadLimitForMimeType('application/pdf')).toBe(mediaUploadLimits.pdf);
    expect(getMediaUploadLimitForMimeType('video/mp4')).toBe(mediaUploadLimits.video);
  });

  it('detects only files over their MIME-specific limits', () => {
    expect(
      findMediaUploadLimitViolation({
        mimetype: 'image/png',
        size: mediaUploadLimits.image.maxBytes,
      }),
    ).toBeUndefined();

    expect(
      findMediaUploadLimitViolation({
        mimetype: 'image/png',
        size: mediaUploadLimits.image.maxBytes + 1,
      }),
    ).toMatchObject({
      kind: 'image',
      maxBytes: mediaUploadLimits.image.maxBytes,
    });

    expect(formatMediaUploadLimit(mediaUploadLimits.pdf.maxBytes)).toBe('20 MB');
  });

  it('rejects oversized Media uploads through the collection hook', async () => {
    const hook = Media.hooks?.beforeOperation?.[0];
    const logger = { warn: vi.fn() };

    await expect(
      async () => hook?.({
        args: {},
        collection: Media as never,
        context: {},
        operation: 'create',
        req: {
          files: {
            file: {
              mimetype: 'application/pdf',
              size: mediaUploadLimits.pdf.maxBytes + 1,
            },
          },
          payload: { logger },
        } as never,
      }),
    ).rejects.toMatchObject({
      data: { code: 'UPLOAD_TOO_LARGE' },
      status: 413,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        limitBytes: mediaUploadLimits.pdf.maxBytes,
        mediaKind: 'pdf',
      }),
    );
  });
});
