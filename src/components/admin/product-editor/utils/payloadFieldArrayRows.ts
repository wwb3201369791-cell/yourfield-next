export type PayloadArrayRow = Record<string, unknown>;

export type ResolvePayloadFieldArrayRowsOptions = Readonly<{
  fallbackValue?: unknown;
  fieldValue: unknown;
  hasLocalOverride: boolean;
  path?: string;
  reducedValue: unknown;
}>;

const rowMetadataKeys = new Set(['_id', 'blockType', 'createdAt', 'id', 'updatedAt']);

export function valueAtPath(value: unknown, path: string): unknown {
  if (!path) {
    return value;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

function hasMediaReference(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const media = value as {
    id?: unknown;
    sizes?: Record<string, { url?: string } | undefined>;
    thumbnailURL?: string;
    url?: string;
  };

  return Boolean(
    typeof media.id === 'number' ||
    typeof media.id === 'string' ||
    media.url ||
    media.thumbnailURL ||
    media.sizes?.card?.url ||
    media.sizes?.feature?.url ||
    media.sizes?.hero?.url ||
    media.sizes?.mobile?.url ||
    media.sizes?.og?.url ||
    media.sizes?.thumbnail?.url,
  );
}

function hasMeaningfulValue(value: unknown, key = ''): boolean {
  if (key === 'file' || key === 'attachment' || key === 'icon') {
    return hasMediaReference(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulValue(entry));
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return Object.entries(record).some(
    ([entryKey, entryValue]) =>
      !rowMetadataKeys.has(entryKey) && hasMeaningfulValue(entryValue, entryKey),
  );
}

function visualGroupRowHasImages(row: unknown): boolean {
  if (!row || typeof row !== 'object') {
    return false;
  }

  const images = (row as { images?: unknown }).images;
  return (
    Array.isArray(images) &&
    images.some((image) => {
      if (!image || typeof image !== 'object') {
        return false;
      }

      return hasMediaReference((image as { file?: unknown }).file);
    })
  );
}

function rowHasDisplayableContent(row: unknown, path = ''): boolean {
  if (path === 'visualGroups') {
    return visualGroupRowHasImages(row);
  }

  if (path === 'images' || path.endsWith('.images')) {
    if (!row || typeof row !== 'object') {
      return false;
    }

    return hasMediaReference((row as { file?: unknown }).file);
  }

  if (!row || typeof row !== 'object') {
    return hasMeaningfulValue(row);
  }

  const record = row as Record<string, unknown>;
  return Object.entries(record).some(
    ([entryKey, entryValue]) =>
      !rowMetadataKeys.has(entryKey) && hasMeaningfulValue(entryValue, entryKey),
  );
}

export function hasDisplayablePayloadArrayRows(value: unknown, path = ''): boolean {
  return Array.isArray(value) && value.some((row) => rowHasDisplayableContent(row, path));
}

export function resolvePayloadFieldArrayRows<T extends PayloadArrayRow = PayloadArrayRow>({
  fallbackValue,
  fieldValue,
  hasLocalOverride,
  path = '',
  reducedValue,
}: ResolvePayloadFieldArrayRowsOptions): T[] {
  if (hasLocalOverride) {
    return Array.isArray(fieldValue) ? (fieldValue as T[]) : [];
  }

  if (hasDisplayablePayloadArrayRows(fieldValue, path)) {
    return fieldValue as T[];
  }

  if (hasDisplayablePayloadArrayRows(reducedValue, path)) {
    return reducedValue as T[];
  }

  if (hasDisplayablePayloadArrayRows(fallbackValue, path)) {
    return fallbackValue as T[];
  }

  return [];
}
