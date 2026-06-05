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
  thumbnailURL?: string;
  url?: string;
  width?: number;
};

const defaultImageLabel = '产品图片';
const defaultVideoLabel = '视频';
const mediaPathPrefix = '/media/';
const payloadMediaFilePathSegment = '/media/file/';
const localMediaHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function currentBrowserHostname() {
  return typeof window === 'undefined' ? '' : window.location.hostname.toLowerCase();
}

function isLocalOrCurrentHostname(hostname: string) {
  const currentHostname = currentBrowserHostname();

  return (
    localMediaHostnames.has(hostname) || Boolean(currentHostname && hostname === currentHostname)
  );
}

function isRelativeMediaPath(value: string) {
  return (
    value.startsWith(mediaPathPrefix) ||
    (value.startsWith('/') &&
      !value.startsWith('//') &&
      value.includes(payloadMediaFilePathSegment))
  );
}

function mediaPathFromParsedUrl(parsed: URL) {
  if (
    parsed.pathname.startsWith(mediaPathPrefix) ||
    parsed.pathname.includes(payloadMediaFilePathSegment)
  ) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  const mediaPathIndex = parsed.pathname.indexOf(mediaPathPrefix);

  return mediaPathIndex >= 0
    ? `${parsed.pathname.slice(mediaPathIndex)}${parsed.search}${parsed.hash}`
    : '';
}

export function normalizeAdminMediaUrl(url: string | undefined) {
  const value = url?.trim() ?? '';

  if (!value) {
    return '';
  }

  if (isRelativeMediaPath(value)) {
    return value;
  }

  if (value.startsWith('//')) {
    try {
      const parsed = new URL(`http:${value}`);
      const hostname = parsed.hostname.toLowerCase();

      return isLocalOrCurrentHostname(hostname) ? mediaPathFromParsedUrl(parsed) || value : value;
    } catch {
      return value;
    }
  }

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    return isLocalOrCurrentHostname(hostname) ? mediaPathFromParsedUrl(parsed) || value : value;
  } catch {
    if (value.includes(payloadMediaFilePathSegment)) {
      const pathStart = value.lastIndexOf('/', value.indexOf(payloadMediaFilePathSegment) - 1);

      return pathStart >= 0 ? value.slice(pathStart) : value;
    }

    const mediaPathIndex = value.indexOf(mediaPathPrefix);

    return mediaPathIndex >= 0 ? value.slice(mediaPathIndex) : value;
  }
}

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
  return normalizeAdminMediaUrl(
    media?.url ??
      media?.thumbnailURL ??
      media?.sizes?.thumbnail?.url ??
      media?.sizes?.card?.url ??
      media?.sizes?.feature?.url,
  );
}

export function getMediaOriginalUrl(media: AdminMediaDoc | undefined) {
  return normalizeAdminMediaUrl(media?.url) || getMediaPreviewUrl(media);
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
