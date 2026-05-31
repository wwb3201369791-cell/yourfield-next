import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildMediaAltText,
  getMediaOriginalUrl,
  getMediaPreviewUrl,
  normalizeAdminMediaUrl,
} from '@/components/admin/media-upload/mediaUploadUtils';
import { imageUploadField, videoUploadField } from '@/lib/payload/fields/simpleMediaUpload';

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: function MockSimpleMediaUploadField() {
    return null;
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    expect(getMediaPreviewUrl({ thumbnailURL: '/media/thumb-url.webp' })).toBe(
      '/media/thumb-url.webp',
    );
    expect(getMediaPreviewUrl({ sizes: { feature: { url: '/media/feature.webp' } } })).toBe(
      '/media/feature.webp',
    );
  });

  it('normalizes localhost media URLs for admin previews behind a remote origin', () => {
    expect(normalizeAdminMediaUrl('http://localhost:3000/media/1-25.png')).toBe('/media/1-25.png');
    expect(normalizeAdminMediaUrl('http://localhost:3000/payload-api/media/file/1-25.png')).toBe(
      '/payload-api/media/file/1-25.png',
    );
    expect(normalizeAdminMediaUrl('http://localhost:3000/custom-api/media/file/1-25.png')).toBe(
      '/custom-api/media/file/1-25.png',
    );
    expect(normalizeAdminMediaUrl('/custom-api/media/file/1-25.png')).toBe(
      '/custom-api/media/file/1-25.png',
    );
    expect(normalizeAdminMediaUrl('//localhost:3000/media/1-25.png')).toBe('/media/1-25.png');
    expect(normalizeAdminMediaUrl('//localhost:3000/payload-api/media/file/1-25.png')).toBe(
      '/payload-api/media/file/1-25.png',
    );
    expect(normalizeAdminMediaUrl('http://localhost:3000/media/1-25.png?v=1#preview')).toBe(
      '/media/1-25.png?v=1#preview',
    );
    expect(normalizeAdminMediaUrl('http://127.0.0.1:3000/media/1-25-600x400.png')).toBe(
      '/media/1-25-600x400.png',
    );
    expect(
      getMediaOriginalUrl({
        sizes: {
          card: { url: 'http://localhost:3000/media/1-25-600x400.png' },
          thumbnail: { url: 'http://localhost:3000/media/1-25-200x200.png' },
        },
        url: 'http://localhost:3000/media/1-25.png',
      }),
    ).toBe('/media/1-25.png');
  });

  it('normalizes media URLs for the current browser host and keeps external media URLs untouched', () => {
    vi.stubGlobal('window', { location: { hostname: 'cms.example.com' } });

    expect(normalizeAdminMediaUrl('https://cms.example.com/media/product.png')).toBe(
      '/media/product.png',
    );
    expect(normalizeAdminMediaUrl('//cms.example.com/media/product.png?size=thumb')).toBe(
      '/media/product.png?size=thumb',
    );
    expect(
      normalizeAdminMediaUrl('https://cms.example.com/payload-api/media/file/product.png'),
    ).toBe('/payload-api/media/file/product.png');
    expect(
      normalizeAdminMediaUrl('https://cms.example.com/custom-api/media/file/product.png'),
    ).toBe('/custom-api/media/file/product.png');
    expect(normalizeAdminMediaUrl('https://cdn.example.com/media/product.png')).toBe(
      'https://cdn.example.com/media/product.png',
    );
    expect(normalizeAdminMediaUrl('//cdn.example.com/media/product.png')).toBe(
      '//cdn.example.com/media/product.png',
    );
  });

  it('keeps external media URLs untouched in admin previews', () => {
    expect(normalizeAdminMediaUrl('https://cdn.example.com/assets/product.png')).toBe(
      'https://cdn.example.com/assets/product.png',
    );
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
