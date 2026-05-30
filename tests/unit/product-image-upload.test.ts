import { describe, expect, it, vi } from 'vitest';

import {
  buildMediaAltText,
  getMediaPreviewUrl,
} from '@/components/admin/media-upload/mediaUploadUtils';
import { imageUploadField, videoUploadField } from '@/lib/payload/fields/simpleMediaUpload';

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: function MockSimpleMediaUploadField() {
    return null;
  },
}));

describe('product image upload helpers', () => {
  it('builds a localized default alt from the product name', () => {
    expect(buildMediaAltText({ fileName: 'main-image.png', title: '防电弧服' })).toEqual({
      en: '防电弧服 产品图片',
      ru: '防电弧服 产品图片',
      zh: '防电弧服 产品图片',
    });
  });

  it('falls back to a cleaned file name when product name is empty', () => {
    expect(buildMediaAltText({ fileName: 'arc-flash-suit-front.webp', title: '' })).toEqual({
      en: 'arc flash suit front 产品图片',
      ru: 'arc flash suit front 产品图片',
      zh: 'arc flash suit front 产品图片',
    });
  });

  it('prefers thumbnail media URL for compact previews', () => {
    expect(
      getMediaPreviewUrl({
        sizes: {
          card: { url: '/media/card.webp' },
          thumbnail: { url: '/media/thumb.webp' },
        },
        url: '/media/original.webp',
      }),
    ).toBe('/media/thumb.webp');
  });

  it('keeps existing admin options when switching an upload field to the simplified image picker', () => {
    const field = imageUploadField({
      name: 'cover',
      label: '封面图',
      admin: {
        description: '前台卡片图。',
        disableListColumn: true,
      },
    });

    expect(field.type).toBe('upload');
    expect(field.relationTo).toBe('media');
    expect(field.admin?.description).toBe('前台卡片图。');
    expect(field.admin?.disableListColumn).toBe(true);
    expect(field.admin?.components?.Field).toBe(
      '@/components/admin/media-upload/SimpleMediaUploadField',
    );
  });

  it('can switch an upload field to the simplified video picker', () => {
    const field = videoUploadField({
      name: 'featuredVideo',
      label: '重点卡片视频',
    });

    expect(field.type).toBe('upload');
    expect(field.relationTo).toBe('media');
    expect(field.custom).toMatchObject({ mediaKind: 'video' });
    expect(field.admin?.components?.Field).toBe(
      '@/components/admin/media-upload/SimpleMediaUploadField',
    );
  });
});
