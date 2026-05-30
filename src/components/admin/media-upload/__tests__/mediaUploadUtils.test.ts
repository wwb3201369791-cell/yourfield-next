import { describe, expect, it } from 'vitest';

import { buildMediaUploadAltText, normalizeMediaUploadError } from '../mediaUploadUtils';

describe('media upload utilities', () => {
  it('builds a scalar alt value for Payload localized upload fields', () => {
    expect(
      buildMediaUploadAltText({
        fileName: 'front-view.webp',
        locale: 'zh',
        title: '消防员灭火防护服',
      }),
    ).toBe('消防员灭火防护服 产品图片');
  });

  it('falls back to the cleaned filename when the title is empty', () => {
    expect(
      buildMediaUploadAltText({
        fileName: 'front_view.webp',
        locale: 'ru',
        title: '',
      }),
    ).toBe('front view 产品图片');
  });

  it('turns raw alt validation errors into an editor-friendly upload message', () => {
    expect(normalizeMediaUploadError('以下字段是无效的：alt', '上传失败')).toBe(
      '图片上传失败：系统生成的图片描述未通过校验，请重新选择图片后再试。',
    );
  });

  it('builds video upload alt text without appending an image label', () => {
    expect(
      buildMediaUploadAltText({
        fileName: 'news-video.mp4',
        locale: 'zh',
        mediaKind: 'video',
        title: '重点卡片视频',
      }),
    ).toBe('重点卡片视频');
  });

  it('turns raw video alt validation errors into a video upload message', () => {
    expect(normalizeMediaUploadError('以下字段是无效的：alt', '上传失败', 'video')).toBe(
      '视频上传失败：系统生成的媒体描述未通过校验，请重新选择后再试。',
    );
  });
});
