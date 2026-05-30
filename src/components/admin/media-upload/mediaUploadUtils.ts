type LocalizedText = {
  en: string;
  ru: string;
  zh: string;
};

type SupportedAltLocale = keyof LocalizedText;
export type MediaUploadKind = 'image' | 'video';

export type AdminMediaDoc = {
  id?: number | string;
  filename?: string;
  filesize?: number;
  height?: number;
  mimeType?: string;
  sizes?: Record<string, { url?: string } | undefined>;
  url?: string;
  width?: number;
};

const defaultImageLabel = '产品图片';
const defaultVideoLabel = '视频';

function mediaLabel(mediaKind: MediaUploadKind | undefined) {
  return mediaKind === 'video' ? defaultVideoLabel : defaultImageLabel;
}

function mediaErrorLabel(mediaKind: MediaUploadKind | undefined) {
  return mediaKind === 'video' ? defaultVideoLabel : '图片';
}

export function cleanMediaFileName(fileName: string) {
  const name = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return name || defaultImageLabel;
}

function cleanTitle(title: string) {
  return title
    .replace(/[（(][^）)]*可选[^）)]*[）)]/g, '')
    .replace(/[*：:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildMediaAltText({
  fileName,
  mediaKind,
  title,
}: {
  fileName: string;
  mediaKind?: MediaUploadKind;
  title: string;
}): LocalizedText {
  const base = cleanTitle(title) || cleanMediaFileName(fileName);
  const defaultLabel = mediaLabel(mediaKind);
  const alt = base.includes(defaultLabel) ? base : `${base} ${defaultLabel}`;

  return {
    en: alt,
    ru: alt,
    zh: alt,
  };
}

function isSupportedAltLocale(locale: string | undefined): locale is SupportedAltLocale {
  return locale === 'zh' || locale === 'en' || locale === 'ru';
}

export function buildMediaUploadAltText({
  fileName,
  locale,
  mediaKind,
  title,
}: {
  fileName: string;
  locale: string | undefined;
  mediaKind?: MediaUploadKind;
  title: string;
}) {
  const localizedAlt = buildMediaAltText({
    fileName,
    ...(mediaKind ? { mediaKind } : {}),
    title,
  });
  const localeKey = isSupportedAltLocale(locale) ? locale : 'zh';

  return localizedAlt[localeKey] || localizedAlt.zh;
}

export function normalizeMediaUploadError(
  message: string | undefined,
  fallback: string,
  mediaKind?: MediaUploadKind,
) {
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (/(\balt\b|图片描述|image description)/i.test(cleanMessage)) {
    if (mediaKind !== 'video') {
      return '图片上传失败：系统生成的图片描述未通过校验，请重新选择图片后再试。';
    }

    return `${mediaErrorLabel(mediaKind)}上传失败：系统生成的媒体描述未通过校验，请重新选择后再试。`;
  }

  return cleanMessage || fallback;
}

export function getMediaPreviewUrl(media: AdminMediaDoc | undefined) {
  return media?.sizes?.thumbnail?.url ?? media?.sizes?.card?.url ?? media?.url ?? '';
}

export function getMediaOriginalUrl(media: AdminMediaDoc | undefined) {
  return media?.sizes?.card?.url ?? media?.url ?? getMediaPreviewUrl(media);
}

export function formatMediaFileSize(bytes: number | undefined) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function inferMediaFolder(path: string) {
  const normalizedPath = path.toLowerCase();

  if (/(icon|logo|favicon|appletouchicon)/.test(normalizedPath)) {
    return 'icons';
  }

  if (normalizedPath.includes('product')) {
    return 'products';
  }

  if (normalizedPath.includes('cover')) {
    return 'news';
  }

  return 'misc';
}
