import type {
  CollectionAfterChangeHook as AfterChangeHook,
  CollectionAfterDeleteHook as AfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload';

import type { AuditLog } from '@/payload-types';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'upload'
  | 'media-delete'
  | 'form-submitted'
  | 'config-change';

type AuditCollectionSlug = string;
type PayloadDocument = Record<string, unknown>;
type HookDocument = PayloadDocument & { id: string | number };
type HookGlobalDocument = PayloadDocument;
type HookAfterChange = AfterChangeHook<HookDocument>;
type HookAfterDelete = AfterDeleteHook<HookDocument>;
type AuditJsonValue = Exclude<AuditLog['documentSnapshot'], undefined>;
type AuditLogCreateData = Partial<Omit<AuditLog, 'createdAt' | 'id' | 'updatedAt'>> &
  Pick<AuditLog, 'action' | 'userEmail'>;

type AuditLogArgs = {
  req: PayloadRequest;
  action: AuditAction;
  collection?: AuditCollectionSlug | undefined;
  documentId?: string | undefined;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown> | undefined;
};

const AUDIT_LOGS_COLLECTION = 'audit-logs';
const REDACTED_VALUE = '[REDACTED]';
const MAX_REDACTION_DEPTH = 12;
const sensitiveKeyPattern =
  /(password|passphrase|passwordHash|password_hash|passwordSalt|password_salt|hash|salt|token|secret|twoFactorSecret|two_factor_secret|apiKey|api_key|authorization|cookie|smtp|s3_.*key|accessKey|access_key|secretKey|secret_key|privateKey|private_key|credential|credentials|session|jwt|bearer)/i;
const formSubmissionPiiKeyPattern =
  /^(company|country|email|ip|message|mobile|name|notes|phone|position|sourceUrl|text|userAgent)$/i;

type RedactionContext = {
  collection?: AuditCollectionSlug;
};

const shouldRedactKey = (key: string, context: RedactionContext) =>
  sensitiveKeyPattern.test(key) ||
  (context.collection === 'form-submissions' && formSubmissionPiiKeyPattern.test(key));

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

const userEmailFrom = (req: PayloadRequest) => {
  const user = req.user as { email?: unknown } | null;

  if (typeof user?.email === 'string' && user.email.trim()) {
    return user.email;
  }

  return 'system';
};

const userIdFrom = (req: PayloadRequest) => documentIdFrom(req.user);

const userRelationIdFrom = (req: PayloadRequest) => {
  const id = userIdFrom(req);
  const numericId = id ? Number(id) : Number.NaN;

  return Number.isInteger(numericId) ? numericId : undefined;
};

const headerValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join(', ');
  }

  return undefined;
};

const requestHeader = (req: PayloadRequest, name: string) => {
  const headers = req.headers as Headers | Record<string, unknown> | undefined;

  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  return headerValue(headers?.[name]);
};

const requestIpFrom = (req: PayloadRequest) =>
  requestHeader(req, 'x-forwarded-for')?.split(',')[0]?.trim() ||
  (req as { ip?: string; socket?: { remoteAddress?: string } }).ip ||
  (req as { socket?: { remoteAddress?: string } }).socket?.remoteAddress ||
  undefined;

const requestUserAgentFrom = (req: PayloadRequest) => requestHeader(req, 'user-agent');

const redactSnapshot = (
  value: unknown,
  context: RedactionContext = {},
  depth = 0,
  seen = new WeakSet<object>(),
): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (depth >= MAX_REDACTION_DEPTH) {
    return '[MAX_DEPTH]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (seen.has(value)) {
    return '[CIRCULAR]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSnapshot(item, context, depth + 1, seen));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (shouldRedactKey(key, context)) {
      sanitized[key] = REDACTED_VALUE;
      continue;
    }

    sanitized[key] = redactSnapshot(nestedValue, context, depth + 1, seen);
  }

  return sanitized;
};

const auditJsonValue = (value: unknown): AuditJsonValue => {
  const redacted = redactSnapshot(value);

  return redacted === undefined ? null : (redacted as AuditJsonValue);
};

const isPublished = (doc: unknown) => {
  if (!doc || typeof doc !== 'object') {
    return false;
  }

  const status = (doc as PayloadDocument)._status;
  return status === 'published';
};

const actionForAfterChange = (
  collection: AuditCollectionSlug,
  operation: 'create' | 'update',
  doc: PayloadDocument,
  previousDoc: PayloadDocument | undefined,
): AuditAction => {
  if (collection === 'media') {
    return operation === 'create' ? 'upload' : 'update';
  }

  if (collection === 'form-submissions' && operation === 'create') {
    return 'form-submitted';
  }

  if (operation === 'update' && '_status' in doc) {
    const wasPublished = isPublished(previousDoc);
    const nowPublished = isPublished(doc);

    if (!wasPublished && nowPublished) {
      return 'publish';
    }

    if (wasPublished && !nowPublished) {
      return 'unpublish';
    }
  }

  return operation;
};

const metadataForAfterChange = (
  operation: 'create' | 'update',
  doc: PayloadDocument,
  previousDoc: PayloadDocument | undefined,
) => {
  const metadata: Record<string, unknown> = { operation };

  if ('_status' in doc || (previousDoc && '_status' in previousDoc)) {
    metadata.statusBefore = previousDoc?._status;
    metadata.statusAfter = doc._status;
  }

  return metadata;
};

export const writeAuditLog = async ({
  req,
  action,
  collection,
  documentId,
  before,
  after,
  metadata,
}: AuditLogArgs) => {
  if (collection === AUDIT_LOGS_COLLECTION) {
    return;
  }

  const redactionContext: RedactionContext = collection ? { collection } : {};
  const data: AuditLogCreateData = {
    userEmail: userEmailFrom(req),
    action,
    documentSnapshot: {
      before: auditJsonValue(redactSnapshot(before, redactionContext)),
      after: auditJsonValue(redactSnapshot(after, redactionContext)),
    },
  };
  const user = userRelationIdFrom(req);
  const ip = requestIpFrom(req);
  const userAgent = requestUserAgentFrom(req);

  if (user !== undefined) data.user = user;
  if (collection) data.collection = collection;
  if (documentId) data.documentId = documentId;
  if (ip) data.ip = ip;
  if (userAgent) data.userAgent = userAgent;
  if (metadata) data.metadata = auditJsonValue(redactSnapshot(metadata, redactionContext));

  await req.payload.create({
    collection: AUDIT_LOGS_COLLECTION,
    overrideAccess: true,
    req,
    data,
  });
};

export const auditAfterChange = (collectionSlug: AuditCollectionSlug): HookAfterChange => {
  return async ({ doc, operation, previousDoc, req }) => {
    if (collectionSlug === AUDIT_LOGS_COLLECTION) {
      return doc;
    }

    const document = doc as PayloadDocument;
    const previousDocument = previousDoc as PayloadDocument | undefined;

    try {
      await writeAuditLog({
        req,
        action: actionForAfterChange(collectionSlug, operation, document, previousDocument),
        collection: collectionSlug,
        documentId: documentIdFrom(document),
        before: previousDocument,
        after: document,
        metadata: metadataForAfterChange(operation, document, previousDocument),
      });
    } catch (error) {
      console.warn('[audit] failed to write audit log', {
        collection: collectionSlug,
        documentId: documentIdFrom(document),
        error: error instanceof Error ? error.message : 'Unknown audit error',
      });
    }

    return doc;
  };
};

export const auditAfterDelete = (collectionSlug: AuditCollectionSlug): HookAfterDelete => {
  return async ({ doc, id, req }) => {
    if (collectionSlug === AUDIT_LOGS_COLLECTION) {
      return doc;
    }

    try {
      await writeAuditLog({
        req,
        action: collectionSlug === 'media' ? 'media-delete' : 'delete',
        collection: collectionSlug,
        documentId: documentIdFrom(id),
        before: doc,
        metadata: { operation: 'delete' },
      });
    } catch (error) {
      console.warn('[audit] failed to write delete audit log', {
        collection: collectionSlug,
        documentId: documentIdFrom(id),
        error: error instanceof Error ? error.message : 'Unknown audit error',
      });
    }

    return doc;
  };
};

export const auditGlobalAfterChange = (globalSlug: string): GlobalAfterChangeHook => {
  return async ({ doc, previousDoc, req }): Promise<HookGlobalDocument> => {
    try {
      await writeAuditLog({
        req,
        action: 'config-change',
        collection: globalSlug,
        documentId: globalSlug,
        before: previousDoc,
        after: doc,
        metadata: { operation: 'global-update', global: globalSlug },
      });
    } catch (error) {
      console.warn('[audit] failed to write global audit log', {
        global: globalSlug,
        error: error instanceof Error ? error.message : 'Unknown audit error',
      });
    }

    return doc as HookGlobalDocument;
  };
};
