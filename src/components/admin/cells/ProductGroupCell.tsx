'use client';

import { useEffect, useMemo, useState } from 'react';

type CellProps = Readonly<{
  cellData?: unknown;
  data?: unknown;
  rowData?: Readonly<Record<string, unknown>>;
}>;

type LocalizedLabel = string | Readonly<Record<string, unknown>> | null | undefined;
type ProductGroupDoc = Readonly<{
  id?: number | string;
  name?: LocalizedLabel;
  title?: LocalizedLabel;
}>;

const productGroupLabelCache = new Map<string, string | null | Promise<string | null>>();
const productRowGroupLabelCache = new Map<string, string | null | Promise<string | null>>();

function localizedLabel(value: LocalizedLabel): string | null {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (value && typeof value === 'object') {
    for (const locale of ['zh', 'en', 'ru']) {
      const localized = value[locale];
      if (typeof localized === 'string' && localized.trim()) {
        return localized.trim();
      }
    }

    for (const localized of Object.values(value)) {
      if (typeof localized === 'string' && localized.trim()) {
        return localized.trim();
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function productGroupLabelFromValue(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return (
    localizedLabel((value as ProductGroupDoc).name) ??
    localizedLabel((value as ProductGroupDoc).title)
  );
}

export function productGroupIdFromValue(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (isRecord(value)) {
    const relationValue = value.value;
    if (typeof relationValue === 'number' || typeof relationValue === 'string') {
      return String(relationValue);
    }

    const id = value.id;
    if (typeof id === 'number' || typeof id === 'string') {
      return String(id);
    }
  }

  return null;
}

function productGroupValue({ cellData, data, rowData }: CellProps) {
  return rowData?.productGroup ?? data ?? cellData;
}

function productRowId({ rowData }: CellProps): string | null {
  const id = rowData?.id;

  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }

  if (typeof id === 'string' && id.trim() && id.trim() !== 'null') {
    return id.trim();
  }

  return null;
}

async function fetchProductGroupLabel(id: string): Promise<string | null> {
  const cached = productGroupLabelCache.get(id);

  if (typeof cached === 'string' || cached === null) {
    return cached;
  }

  if (cached) {
    return cached;
  }

  const request = fetch(`/payload-api/product-groups/${encodeURIComponent(id)}?depth=0&locale=zh`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const doc = (await response.json()) as unknown;
      return productGroupLabelFromValue(doc);
    })
    .catch(() => null);

  productGroupLabelCache.set(id, request);

  const label = await request;
  productGroupLabelCache.set(id, label);

  return label;
}

async function fetchProductRowGroupLabel(rowId: string): Promise<string | null> {
  const cached = productRowGroupLabelCache.get(rowId);

  if (typeof cached === 'string' || cached === null) {
    return cached;
  }

  if (cached) {
    return cached;
  }

  const request = fetch(`/payload-api/products/${encodeURIComponent(rowId)}?depth=1&locale=zh`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const doc = (await response.json()) as unknown;
      const groupValue = isRecord(doc) ? doc.productGroup : null;
      const label = productGroupLabelFromValue(groupValue);

      if (label) {
        return label;
      }

      const groupId = productGroupIdFromValue(groupValue);
      return groupId ? fetchProductGroupLabel(groupId) : null;
    })
    .catch(() => null);

  productRowGroupLabelCache.set(rowId, request);

  const label = await request;
  productRowGroupLabelCache.set(rowId, label);

  return label;
}

export default function ProductGroupCell(props: CellProps) {
  const value = productGroupValue(props);
  const initialLabel = productGroupLabelFromValue(value);
  const id = useMemo(() => productGroupIdFromValue(value), [value]);
  const rowId = productRowId(props);
  const [loadedLabel, setLoadedLabel] = useState<string | null>(initialLabel);

  useEffect(() => {
    let cancelled = false;

    if (initialLabel) {
      setLoadedLabel(initialLabel);
      return () => {
        cancelled = true;
      };
    }

    if (!id && !rowId) {
      setLoadedLabel(null);
      return () => {
        cancelled = true;
      };
    }

    setLoadedLabel(null);
    const request = id ? fetchProductGroupLabel(id) : fetchProductRowGroupLabel(rowId as string);
    void request.then((label) => {
      if (!cancelled) {
        setLoadedLabel(label);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, initialLabel, rowId]);

  const isLoading = Boolean(id || rowId);
  const text = loadedLabel ?? (isLoading ? '读取中…' : '未设置产品大类');
  const stateClass = loadedLabel ? 'is-resolved' : isLoading ? 'is-loading' : 'is-empty';

  return <span className={`yf-product-group-cell ${stateClass}`}>{text}</span>;
}
