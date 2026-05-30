import type { Access } from 'payload';
import type { FieldAccess } from 'payload';

const getDocumentId = (id: unknown) =>
  typeof id === 'string' || typeof id === 'number' ? String(id) : undefined;

const getUserId = (user: unknown) => {
  if (!user || typeof user !== 'object' || !('id' in user)) {
    return undefined;
  }

  const { id } = user as { id?: unknown };
  return getDocumentId(id);
};

type PermissionOperation = 'create' | 'delete' | 'publish' | 'read' | 'update';
type AccessRequest = Parameters<Access>[0]['req'];
type RoleDocument = Record<string, unknown>;

const roleCacheKey = 'yourfield:resolved-role-cache';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function roleFromUser(user: unknown) {
  if (!isRecord(user)) {
    return undefined;
  }

  return user.role;
}

function isRoleDocument(value: unknown): value is RoleDocument {
  return isRecord(value) && (typeof value.slug === 'string' || isRecord(value.permissions));
}

function collectionSlugFromRequest(req: AccessRequest, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  const collection = (req as { collection?: unknown }).collection;
  if (!isRecord(collection)) {
    return undefined;
  }

  const config = collection.config;
  if (isRecord(config) && typeof config.slug === 'string') {
    return config.slug;
  }

  return typeof collection.slug === 'string' ? collection.slug : undefined;
}

function roleCacheFromRequest(req: AccessRequest) {
  const context = req.context as Record<string, unknown>;
  const existingCache = context[roleCacheKey];

  if (existingCache instanceof Map) {
    return existingCache as Map<string, Promise<RoleDocument | null>>;
  }

  const cache = new Map<string, Promise<RoleDocument | null>>();
  context[roleCacheKey] = cache;

  return cache;
}

async function findRoleById(req: AccessRequest, roleId: string) {
  const cache = roleCacheFromRequest(req);
  const cachedRole = cache.get(roleId);

  if (cachedRole) {
    return cachedRole;
  }

  const rolePromise = req.payload
    .findByID({
      collection: 'roles',
      depth: 0,
      id: roleId,
      overrideAccess: true,
    })
    .then((role) => (isRecord(role) ? role : null))
    .catch(() => null);

  cache.set(roleId, rolePromise);

  return rolePromise;
}

async function resolveUserRole(req: AccessRequest, user: unknown) {
  const role = roleFromUser(user);

  if (isRoleDocument(role)) {
    return role;
  }

  const roleId = getDocumentId(role);

  return roleId ? findRoleById(req, roleId) : null;
}

function hasPermissionFlag(permissions: unknown, scope: string, operation: PermissionOperation) {
  if (!isRecord(permissions)) {
    return false;
  }

  const scopePermissions = permissions[scope];

  return isRecord(scopePermissions) && scopePermissions[operation] === true;
}

async function userHasPermission(
  req: AccessRequest,
  operation: PermissionOperation,
  collectionSlug?: string,
) {
  const user = (req as { user?: unknown }).user;

  if (!user) {
    return false;
  }

  const role = await resolveUserRole(req, user);
  if (!role) {
    return false;
  }

  if (role.slug === 'super-admin') {
    return true;
  }

  const scope = collectionSlugFromRequest(req, collectionSlug);

  return (
    hasPermissionFlag(role.permissions, '*', operation) ||
    Boolean(scope && hasPermissionFlag(role.permissions, scope, operation))
  );
}

export function hasPayloadAccess(
  req: AccessRequest,
  operation: PermissionOperation,
  collectionSlug?: string,
) {
  return userHasPermission(req, operation, collectionSlug);
}

async function userIsSuperAdmin(req: AccessRequest) {
  const user = (req as { user?: unknown }).user;

  if (!user) {
    return false;
  }

  const role = await resolveUserRole(req, user);

  return role?.slug === 'super-admin';
}

export const canRead =
  (collectionSlug?: string): Access =>
  ({ req }) =>
    userHasPermission(req, 'read', collectionSlug);

export const canCreate =
  (collectionSlug?: string): Access =>
  ({ req }) =>
    userHasPermission(req, 'create', collectionSlug);

export const canUpdate =
  (collectionSlug?: string): Access =>
  ({ req }) =>
    userHasPermission(req, 'update', collectionSlug);

export const canDelete =
  (collectionSlug?: string): Access =>
  ({ req }) =>
    userHasPermission(req, 'delete', collectionSlug);

export const isAdmin: Access = ({ req }) => userIsSuperAdmin(req);

export const isSuperAdmin: Access = ({ req }) => userIsSuperAdmin(req);

export const isSuperAdminField: FieldAccess = ({ req }) => userIsSuperAdmin(req);

export const isPublic: Access = () => true;

export const isSelf: Access = ({ id, req }) => {
  const user = (req as { user?: unknown }).user;
  const userId = getUserId(user);
  const documentId = getDocumentId(id);

  return Boolean(userId && documentId && userId === documentId);
};

export const isAdminOrSelf: Access = async ({ id, req }) => {
  if (await userHasPermission(req, 'update')) {
    return true;
  }

  const user = (req as { user?: unknown }).user;
  if (!user) {
    return false;
  }

  const userId = getUserId(user);
  const documentId = getDocumentId(id);

  return Boolean(userId && documentId && userId === documentId);
};

export const isAdminOrPublished: Access = async ({ req }) => {
  if (await userHasPermission(req, 'read')) {
    return true;
  }

  return {
    _status: {
      equals: 'published',
    },
  };
};

export const isAdminOrPublishedWithPublishedAt: Access = async ({ req }) => {
  if (await userHasPermission(req, 'read')) {
    return true;
  }

  return {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        publishedAt: {
          greater_than: '1970-01-01T00:00:00.000Z',
        },
      },
    ],
  };
};

export const isAdminOrFaqPublished: Access = async ({ req }) => {
  if (await userHasPermission(req, 'read')) {
    return true;
  }

  return {
    isPublished: {
      equals: true,
    },
  };
};

export const deny: Access = () => false;
