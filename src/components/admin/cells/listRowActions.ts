export type AdminListRowActionCollection = 'solutions' | 'product-groups' | 'products';

export type AdminListRowActionDirection = 'up' | 'down';

type CreateActionConfig = Readonly<{
  key: string;
  collectionSlug: AdminListRowActionCollection;
  label: Readonly<{ en: string; zh: string }>;
  includeProductGroup?: boolean;
}>;

type RowActionConfig = Readonly<{
  createActions: readonly CreateActionConfig[];
  orderField: 'displayOrder' | 'order';
  scopeByProductGroup?: boolean;
}>;

export const adminListRowActionConfig: Record<AdminListRowActionCollection, RowActionConfig> = {
  solutions: {
    orderField: 'order',
    createActions: [
      {
        key: 'create-solution',
        collectionSlug: 'solutions',
        label: { en: 'Add solution', zh: '添加解决方案' },
      },
      {
        key: 'create-product-group',
        collectionSlug: 'product-groups',
        label: { en: 'Add product group', zh: '添加产品大类' },
      },
      {
        key: 'create-product',
        collectionSlug: 'products',
        label: { en: 'Add product', zh: '添加产品' },
      },
    ],
  },
  'product-groups': {
    orderField: 'order',
    createActions: [
      {
        key: 'create-product-group',
        collectionSlug: 'product-groups',
        label: { en: 'Add product group', zh: '添加产品大类' },
      },
      {
        key: 'create-product',
        collectionSlug: 'products',
        label: { en: 'Add product', zh: '添加产品' },
        includeProductGroup: true,
      },
    ],
  },
  products: {
    orderField: 'displayOrder',
    scopeByProductGroup: true,
    createActions: [
      {
        key: 'create-product',
        collectionSlug: 'products',
        label: { en: 'Add product', zh: '添加产品' },
        includeProductGroup: true,
      },
    ],
  },
};

export function normalizeAdminBase(adminBase: string | undefined) {
  const base = adminBase || '/admin';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function normalizeApiBase(apiBase: string | undefined) {
  const base = apiBase || '/payload-api';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function buildAdminListEditHref(
  adminBase: string | undefined,
  collectionSlug: AdminListRowActionCollection,
  id: string | number,
) {
  return `${normalizeAdminBase(adminBase)}/collections/${collectionSlug}/${id}`;
}

export function buildAdminListCreateHref(
  adminBase: string | undefined,
  collectionSlug: AdminListRowActionCollection,
  params?: Readonly<Record<string, string | number | null | undefined>>,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined && String(value).trim()) {
      query.set(key, String(value));
    }
  }

  const suffix = query.toString();

  return `${normalizeAdminBase(adminBase)}/collections/${collectionSlug}/create${suffix ? `?${suffix}` : ''}`;
}

export function rowActionDocumentId(rowData: Readonly<Record<string, unknown>> | null | undefined) {
  const id = rowData?.id;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

export function rowActionOrderValue(
  rowData: Readonly<Record<string, unknown>> | null | undefined,
  orderField: string,
) {
  const value = rowData?.[orderField];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function rowActionProductGroupId(
  rowData: Readonly<Record<string, unknown>> | null | undefined,
) {
  const value = rowData?.productGroup;

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as Readonly<{ id?: unknown }>).id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }

  return null;
}

export function collectionSlugFromAdminPath(pathname: string): AdminListRowActionCollection | null {
  const match = pathname.match(/\/collections\/([^/?#]+)/);
  const slug = match?.[1];

  return slug === 'solutions' || slug === 'product-groups' || slug === 'products' ? slug : null;
}

export function buildNeighborLookupUrl(args: {
  apiBase: string | undefined;
  collectionSlug: AdminListRowActionCollection;
  direction: AdminListRowActionDirection;
  order: number;
  orderField: 'displayOrder' | 'order';
  productGroupId?: string | null;
}) {
  const params = new URLSearchParams();
  const comparator = args.direction === 'up' ? 'less_than' : 'greater_than';
  const sort = args.direction === 'up' ? `-${args.orderField}` : args.orderField;

  params.set('depth', '0');
  params.set('limit', '1');
  params.set(`where[${args.orderField}][${comparator}]`, String(args.order));

  if (args.productGroupId) {
    params.set('where[productGroup][equals]', args.productGroupId);
  }

  params.set('sort', sort);

  return `${normalizeApiBase(args.apiBase)}/${args.collectionSlug}?${params.toString()}`;
}

export function buildDocumentPatchUrl(
  apiBase: string | undefined,
  collectionSlug: AdminListRowActionCollection,
  id: string | number,
) {
  return `${normalizeApiBase(apiBase)}/${collectionSlug}/${id}`;
}

export function neighborDocFromApiResponse(value: unknown) {
  if (!value || typeof value !== 'object' || !('docs' in value)) {
    return null;
  }

  const docs = (value as Readonly<{ docs?: unknown }>).docs;

  return Array.isArray(docs) && docs[0] && typeof docs[0] === 'object'
    ? (docs[0] as Readonly<Record<string, unknown>>)
    : null;
}
