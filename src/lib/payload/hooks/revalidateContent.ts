import { createHmac, randomUUID } from 'node:crypto';

import type {
  CollectionAfterChangeHook as AfterChangeHook,
  CollectionAfterDeleteHook as AfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';

import { env } from '../../env';

type RevalidateCollectionSlug =
  | 'pages'
  | 'product-groups'
  | 'products'
  | 'product-categories'
  | 'solutions'
  | 'news'
  | 'faqs';
type RevalidateGlobalSlug = 'navigation' | 'site-settings';
type PayloadDocument = Record<string, unknown>;
type HookDocument = PayloadDocument & { id: string | number };
type HookGlobalDocument = PayloadDocument;
type CollectionAfterChangeHook = AfterChangeHook<HookDocument>;
type CollectionAfterDeleteHook = AfterDeleteHook<HookDocument>;

type RevalidatePayload = {
  categoryId?: string | undefined;
  collection?: RevalidateCollectionSlug | undefined;
  global?: RevalidateGlobalSlug | undefined;
  documentId?: string | undefined;
  newsRef?: RevalidateReference | undefined;
  operation: 'create' | 'update' | 'publish' | 'unpublish' | 'delete' | 'config-change';
  pageKey?: string | undefined;
  pageRef?: RevalidateReference | undefined;
  productRef?: RevalidateReference | undefined;
  scope?: string | undefined;
  slug?: string | undefined;
};

type RevalidateReference = {
  id?: string | undefined;
  pageKey?: string | undefined;
  slug?: string | undefined;
};

const publishedStatusCollections = new Set<RevalidateCollectionSlug>([
  'pages',
  'products',
  'solutions',
  'news',
]);
const safeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safePageKeys = new Set([
  'home',
  'about',
  'products-index',
  'solutions',
  'news-index',
  'franchise',
  'contact',
  'privacy',
  'cookies',
  'terms',
]);

const safeFaqScopes = new Set(['global', 'page', 'product', 'news']);

const documentIdFrom = (value: unknown): string | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string' || typeof id === 'number') {
      return String(id);
    }
  }

  return undefined;
};

const textFrom = (doc: PayloadDocument, key: string) => {
  const value = doc[key];

  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const safeSlugFrom = (doc: PayloadDocument, key: string) => {
  const value = textFrom(doc, key);

  return value && safeSlugPattern.test(value) ? value : undefined;
};

const safePageKeyFrom = (doc: PayloadDocument) => {
  const value = textFrom(doc, 'pageKey');

  return value && safePageKeys.has(value) ? value : undefined;
};

const safeScopeFrom = (doc: PayloadDocument) => {
  const value = textFrom(doc, 'scope');

  return value && safeFaqScopes.has(value) ? value : undefined;
};

const referenceFrom = (value: unknown): RevalidateReference | undefined => {
  const id = documentIdFrom(value);

  if (!value || typeof value !== 'object') {
    return id ? { id } : undefined;
  }

  const record = value as PayloadDocument;
  const slug = safeSlugFrom(record, 'slug');
  const pageKey = safePageKeyFrom(record);

  if (!id && !slug && !pageKey) {
    return undefined;
  }

  return {
    ...(id ? { id } : {}),
    ...(pageKey ? { pageKey } : {}),
    ...(slug ? { slug } : {}),
  };
};

const routingFieldsForCollection = (
  collectionSlug: RevalidateCollectionSlug,
  doc: PayloadDocument,
): Partial<RevalidatePayload> => {
  switch (collectionSlug) {
    case 'pages':
      return {
        pageKey: safePageKeyFrom(doc),
        slug: safeSlugFrom(doc, 'slug'),
      };
    case 'products':
      return {
        slug: safeSlugFrom(doc, 'slug') ?? safeSlugFrom(doc, 'productId'),
      };
    case 'product-groups':
      return {
        slug: safeSlugFrom(doc, 'slug') ?? safeSlugFrom(doc, 'groupId'),
      };
    case 'product-categories':
      return {
        categoryId: safeSlugFrom(doc, 'categoryId'),
        slug: safeSlugFrom(doc, 'slug'),
      };
    case 'solutions':
      return {
        slug: safeSlugFrom(doc, 'slug') ?? safeSlugFrom(doc, 'solutionId'),
      };
    case 'news':
      return {
        slug: safeSlugFrom(doc, 'slug'),
      };
    case 'faqs':
      return {
        newsRef: referenceFrom(doc.newsRef),
        pageRef: referenceFrom(doc.pageRef),
        productRef: referenceFrom(doc.productRef),
        scope: safeScopeFrom(doc),
      };
    default:
      return {};
  }
};

const isPublished = (doc: unknown) => {
  if (!doc || typeof doc !== 'object') {
    return false;
  }

  return (doc as PayloadDocument)._status === 'published';
};

const shouldRevalidateStatusChange = (
  doc: PayloadDocument,
  previousDoc: PayloadDocument | undefined,
) => {
  const wasPublished = isPublished(previousDoc);
  const nowPublished = isPublished(doc);

  return wasPublished !== nowPublished || nowPublished;
};

const operationForStatusChange = (
  doc: PayloadDocument,
  previousDoc: PayloadDocument | undefined,
): RevalidatePayload['operation'] => {
  const wasPublished = isPublished(previousDoc);
  const nowPublished = isPublished(doc);

  if (!wasPublished && nowPublished) {
    return 'publish';
  }

  if (wasPublished && !nowPublished) {
    return 'unpublish';
  }

  return 'update';
};

const signRevalidatePayload = (secret: string, timestamp: string, nonce: string, body: string) =>
  createHmac('sha256', secret)
    .update(timestamp)
    .update('.')
    .update(nonce)
    .update('.')
    .update(body)
    .digest('hex');

const postRevalidate = async (payload: RevalidatePayload) => {
  if (!env.REVALIDATE_SECRET) {
    return { status: 'skipped' as const, reason: 'missing-secret' };
  }

  const endpoint = new URL('/api/revalidate', env.PAYLOAD_PUBLIC_SERVER_URL);
  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const nonce = randomUUID();
  const signature = signRevalidatePayload(env.REVALIDATE_SECRET, timestamp, nonce, body);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-nonce': nonce,
        'x-revalidate-signature': signature,
        'x-revalidate-timestamp': timestamp,
      },
      body,
    });

    if (!response.ok) {
      console.warn('[revalidate] revalidate request failed', {
        target: payload.collection ?? payload.global,
        operation: payload.operation,
        status: response.status,
      });

      return { status: 'failed' as const, reason: `http-${response.status}` };
    }

    return { status: 'sent' as const };
  } catch (error) {
    console.warn('[revalidate] revalidate request failed', {
      target: payload.collection ?? payload.global,
      operation: payload.operation,
      error: error instanceof Error ? error.message : 'Unknown revalidate error',
    });

    return { status: 'failed' as const, reason: 'request-error' };
  }
};

export const revalidateCollectionAfterChange = (
  collectionSlug: RevalidateCollectionSlug,
): CollectionAfterChangeHook => {
  return async ({ doc, operation, previousDoc }) => {
    const document = doc as PayloadDocument;
    const previousDocument = previousDoc as PayloadDocument | undefined;

    if (
      publishedStatusCollections.has(collectionSlug) &&
      !shouldRevalidateStatusChange(document, previousDocument)
    ) {
      return doc;
    }

    await postRevalidate({
      collection: collectionSlug,
      documentId: documentIdFrom(document),
      operation: publishedStatusCollections.has(collectionSlug)
        ? operationForStatusChange(document, previousDocument)
        : operation,
      ...routingFieldsForCollection(collectionSlug, document),
    });

    return doc;
  };
};

export const revalidateCollectionAfterDelete = (
  collectionSlug: RevalidateCollectionSlug,
): CollectionAfterDeleteHook => {
  return async ({ doc, id }) => {
    const document = doc as PayloadDocument;

    await postRevalidate({
      collection: collectionSlug,
      documentId: documentIdFrom(document) ?? documentIdFrom(id),
      operation: 'delete',
      ...routingFieldsForCollection(collectionSlug, document),
    });

    return doc;
  };
};

export const revalidateGlobalAfterChange = (
  globalSlug: RevalidateGlobalSlug,
): GlobalAfterChangeHook => {
  return async ({ doc }): Promise<HookGlobalDocument> => {
    await postRevalidate({
      global: globalSlug,
      documentId: documentIdFrom(doc),
      operation: 'config-change',
    });

    return doc as HookGlobalDocument;
  };
};
