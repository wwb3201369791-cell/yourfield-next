export function buildProductDocumentHydrationUrl({
  apiBase,
  id,
  locale,
}: {
  apiBase: string;
  id: number | string;
  locale: string;
}) {
  const base = apiBase.replace(/\/$/, '');
  const params = new URLSearchParams({
    depth: '2',
    draft: 'true',
    'fallback-locale': 'null',
    locale,
  });

  return `${base}/products/${encodeURIComponent(String(id))}?${params.toString()}`;
}

export function getProductDocumentIdFromPathname(pathname: string) {
  const match = pathname.match(/\/admin\/collections\/products\/([^/?#]+)/);
  const segment = match?.[1];

  if (!segment || segment === 'create') {
    return '';
  }

  return decodeURIComponent(segment);
}

function textLike(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function imageRowsLike(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((row) => {
      if (!row || typeof row !== 'object') {
        return false;
      }

      const file = (row as { file?: unknown }).file;
      if (typeof file === 'number' || (typeof file === 'string' && file.trim().length > 0)) {
        return true;
      }

      if (file && typeof file === 'object') {
        const media = file as {
          sizes?: Record<string, { url?: string } | undefined>;
          url?: string;
        };
        return Boolean(media.url || media.sizes?.card?.url);
      }

      return false;
    })
  );
}

export function hasVisualEditorSeedValues(values: Record<string, unknown>) {
  const hasIdentity = textLike(values.name) || textLike(values.model);

  return hasIdentity && imageRowsLike(values.images);
}
