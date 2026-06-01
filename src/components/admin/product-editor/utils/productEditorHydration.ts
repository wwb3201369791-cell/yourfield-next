import { hasDisplayablePayloadArrayRows } from './payloadFieldArrayRows';

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

function relationshipIdValue(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const id = (value as { id?: unknown }).id;
  return typeof id === 'number' || typeof id === 'string' ? id : value;
}

function normalizeUploadRows(rows: unknown): unknown {
  if (!Array.isArray(rows)) {
    return rows;
  }

  const rowList = rows as unknown[];
  return rowList.map((row) => {
    if (!row || typeof row !== 'object') {
      return row;
    }

    const record = row as Record<string, unknown>;
    return {
      ...record,
      file: relationshipIdValue(record.file),
    };
  });
}

function normalizeRowsUploadField(rows: unknown, fieldName: string): unknown {
  if (!Array.isArray(rows)) {
    return rows;
  }

  const rowList = rows as unknown[];
  return rowList.map((row) => {
    if (!row || typeof row !== 'object') {
      return row;
    }

    const record = row as Record<string, unknown>;
    return {
      ...record,
      [fieldName]: relationshipIdValue(record[fieldName]),
    };
  });
}

export function normalizeProductDocumentForFormReset(doc: Record<string, unknown>) {
  const visualGroups = Array.isArray(doc.visualGroups) ? (doc.visualGroups as unknown[]) : null;

  return {
    ...doc,
    certifications: normalizeRowsUploadField(doc.certifications, 'attachment'),
    images: normalizeUploadRows(doc.images),
    productGroup: relationshipIdValue(doc.productGroup),
    qualityEvidence: normalizeRowsUploadField(doc.qualityEvidence, 'attachment'),
    sellingPoints: normalizeRowsUploadField(doc.sellingPoints, 'icon'),
    visualGroups: visualGroups
      ? visualGroups.map((group) => {
          if (!group || typeof group !== 'object') {
            return group;
          }

          const record = group as Record<string, unknown>;
          return {
            ...record,
            images: normalizeUploadRows(record.images),
          };
        })
      : doc.visualGroups,
  };
}

function textLike(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function relationshipTextLike(value: unknown): boolean {
  if (textLike(value)) {
    return true;
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  for (const key of ['name', 'label', 'title', 'groupId', 'slug']) {
    const entry = record[key];
    if (textLike(entry)) {
      return true;
    }
    if (entry && typeof entry === 'object') {
      const localized = entry as Record<string, unknown>;
      if (textLike(localized.zh) || textLike(localized.en) || textLike(localized.ru)) {
        return true;
      }
    }
  }

  return false;
}

const imageUrlPattern =
  /^(https?:|\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)([?#].*)?$/i;

function imageUrlLike(value: string) {
  return imageUrlPattern.test(value.trim());
}

function mediaFileLike(value: unknown): boolean {
  if (typeof value === 'string') {
    return imageUrlLike(value);
  }

  if (value && typeof value === 'object') {
    const media = value as {
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
}

function imageRowsLike(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((row) => {
      if (!row || typeof row !== 'object') {
        return false;
      }

      return mediaFileLike((row as { file?: unknown }).file);
    })
  );
}

function arrayRowsLike(value: unknown, path = ''): boolean {
  return hasDisplayablePayloadArrayRows(value, path);
}

function visualGroupRowsLike(value: unknown): boolean {
  return hasDisplayablePayloadArrayRows(value, 'visualGroups');
}

export function hasVisualEditorSeedValues(values: Record<string, unknown>) {
  const hasIdentity = textLike(values.name) || textLike(values.model);
  const hasProductGroup =
    relationshipTextLike(values.productGroup) || relationshipTextLike(values.category);

  return hasIdentity && hasProductGroup && imageRowsLike(values.images);
}

export function mergeHydratedVisualEditorValues(
  formValues: Record<string, unknown>,
  hydratedDoc: Record<string, unknown> | null,
) {
  if (!hydratedDoc) {
    return formValues;
  }

  const merged = {
    ...hydratedDoc,
    ...formValues,
  };

  if (!imageRowsLike(formValues.images) && imageRowsLike(hydratedDoc.images)) {
    merged.images = hydratedDoc.images;
  }

  if (
    !visualGroupRowsLike(formValues.visualGroups) &&
    visualGroupRowsLike(hydratedDoc.visualGroups)
  ) {
    merged.visualGroups = hydratedDoc.visualGroups;
  }

  for (const key of [
    'applications',
    'careInstructions',
    'features',
    'materials',
    'productFaqs',
    'qualityEvidence',
    'scenarios',
    'sellingPoints',
    'sizeRange',
    'specifications',
    'standards',
  ] as const) {
    if (!arrayRowsLike(formValues[key], key) && arrayRowsLike(hydratedDoc[key], key)) {
      merged[key] = hydratedDoc[key];
    }
  }

  if (
    !arrayRowsLike((formValues.sizeGuide as { rows?: unknown } | undefined)?.rows, 'sizeGuide.rows')
  ) {
    const hydratedSizeGuide = hydratedDoc.sizeGuide as { rows?: unknown } | undefined;
    if (arrayRowsLike(hydratedSizeGuide?.rows, 'sizeGuide.rows')) {
      merged.sizeGuide = hydratedDoc.sizeGuide;
    }
  }

  if (
    !relationshipTextLike(formValues.productGroup) &&
    relationshipTextLike(hydratedDoc.productGroup)
  ) {
    merged.productGroup = hydratedDoc.productGroup;
  }

  if (!relationshipTextLike(formValues.category) && relationshipTextLike(hydratedDoc.category)) {
    merged.category = hydratedDoc.category;
  }

  return merged;
}
