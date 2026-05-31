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

const imageUrlPattern =
  /^(https?:|\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)([?#].*)?$/i;

function imageUrlLike(value: string) {
  return imageUrlPattern.test(value.trim());
}

function imageRowsLike(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((row) => {
      if (!row || typeof row !== 'object') {
        return false;
      }

      const file = (row as { file?: unknown }).file;
      if (typeof file === 'string') {
        return imageUrlLike(file);
      }

      if (file && typeof file === 'object') {
        const media = file as {
          sizes?: Record<string, { url?: string } | undefined>;
          thumbnailURL?: string;
          url?: string;
        };
        return Boolean(
          media.url ||
          media.thumbnailURL ||
          media.sizes?.card?.url ||
          media.sizes?.thumbnail?.url ||
          media.sizes?.feature?.url,
        );
      }

      return false;
    })
  );
}

export function hasVisualEditorSeedValues(values: Record<string, unknown>) {
  const hasIdentity = textLike(values.name) || textLike(values.model);

  return hasIdentity && imageRowsLike(values.images);
}

export function mergeHydratedVisualEditorValues(
  formValues: Record<string, unknown>,
  hydratedDoc: Record<string, unknown> | null,
) {
  if (hasVisualEditorSeedValues(formValues) || !hydratedDoc) {
    return formValues;
  }

  const merged = {
    ...hydratedDoc,
    ...formValues,
  };

  if (!imageRowsLike(formValues.images) && imageRowsLike(hydratedDoc.images)) {
    merged.images = hydratedDoc.images;
  }

  return merged;
}
