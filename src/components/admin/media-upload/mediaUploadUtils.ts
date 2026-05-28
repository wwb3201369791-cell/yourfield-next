type LocalizedText = {
  en: string;
  ru: string;
  zh: string;
};

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
  title,
}: {
  fileName: string;
  title: string;
}): LocalizedText {
  const base = cleanTitle(title) || cleanMediaFileName(fileName);
  const alt = base.includes(defaultImageLabel) ? base : `${base} ${defaultImageLabel}`;

  return {
    en: alt,
    ru: alt,
    zh: alt,
  };
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
