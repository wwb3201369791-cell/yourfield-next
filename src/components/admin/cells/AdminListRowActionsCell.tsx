'use client';

import { useConfig } from '@payloadcms/ui';
import { useCallback, useMemo, useState } from 'react';

import { useAdminText } from '../adminUiLocale';

import {
  adminListRowActionConfig,
  buildAdminListCreateHref,
  buildAdminListEditHref,
  buildDocumentPatchUrl,
  buildNeighborLookupUrl,
  collectionSlugFromAdminPath,
  neighborDocFromApiResponse,
  rowActionDocumentId,
  rowActionOrderValue,
  rowActionProductGroupId,
  type AdminListRowActionCollection,
  type AdminListRowActionDirection,
} from './listRowActions';

type CellProps = Readonly<{
  collectionSlug?: unknown;
  rowData?: Readonly<Record<string, unknown>>;
}>;

function normalizeCollectionSlug(value: unknown): AdminListRowActionCollection | null {
  return value === 'news' ||
    value === 'solutions' ||
    value === 'product-groups' ||
    value === 'products'
    ? value
    : null;
}

function currentCollectionSlug(): AdminListRowActionCollection | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return collectionSlugFromAdminPath(window.location.pathname);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const data: unknown = await response.json();
    return data;
  } catch {
    return null;
  }
}

export default function AdminListRowActionsCell({
  collectionSlug: collectionSlugProp,
  rowData,
}: CellProps) {
  const t = useAdminText();
  const {
    config: { routes },
  } = useConfig();
  const [moving, setMoving] = useState<AdminListRowActionDirection | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const collectionSlug = normalizeCollectionSlug(collectionSlugProp) ?? currentCollectionSlug();
  const config = collectionSlug ? adminListRowActionConfig[collectionSlug] : null;
  const documentId = rowActionDocumentId(rowData);
  const order = config?.orderField ? rowActionOrderValue(rowData, config.orderField) : null;
  const productGroupId = rowActionProductGroupId(rowData);
  const [menuOpen, setMenuOpen] = useState(false);
  const editHref =
    collectionSlug && documentId
      ? buildAdminListEditHref(routes.admin, collectionSlug, documentId)
      : null;
  const createLinks = useMemo(() => {
    if (!config) {
      return [];
    }

    return config.createActions.map((action) => ({
      ...action,
      href: buildAdminListCreateHref(
        routes.admin,
        action.collectionSlug,
        action.includeProductGroup ? { productGroup: productGroupId } : undefined,
      ),
    }));
  }, [config, productGroupId, routes.admin]);

  const moveRow = useCallback(
    async (direction: AdminListRowActionDirection) => {
      if (!collectionSlug || !config?.orderField || !documentId || order === null) {
        return;
      }

      const orderField = config.orderField;

      setMoving(direction);
      setMessage(null);
      setMenuOpen(false);

      try {
        const neighborResponse = await fetch(
          buildNeighborLookupUrl({
            apiBase: routes.api,
            collectionSlug,
            direction,
            order,
            orderField,
            productGroupId: config.scopeByProductGroup ? productGroupId : null,
          }),
          { credentials: 'include' },
        );

        if (!neighborResponse.ok) {
          throw new Error(`neighbor:${neighborResponse.status}`);
        }

        const neighborDoc = neighborDocFromApiResponse(await readJson(neighborResponse));
        const neighborId = rowActionDocumentId(neighborDoc);
        const neighborOrder = rowActionOrderValue(neighborDoc, orderField);

        if (!neighborId || neighborOrder === null) {
          setMessage(t(direction === 'up' ? '已经是第一位' : '已经是最后一位'));
          return;
        }

        const patchOptions = (nextOrder: number) => ({
          body: JSON.stringify({ [orderField]: nextOrder }),
          credentials: 'include' as const,
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        });

        const [currentPatch, neighborPatch] = await Promise.all([
          fetch(
            buildDocumentPatchUrl(routes.api, collectionSlug, documentId),
            patchOptions(neighborOrder),
          ),
          fetch(buildDocumentPatchUrl(routes.api, collectionSlug, neighborId), patchOptions(order)),
        ]);

        if (!currentPatch.ok || !neighborPatch.ok) {
          throw new Error(`patch:${currentPatch.status}/${neighborPatch.status}`);
        }

        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } catch {
        setMessage(t('调整顺序失败'));
      } finally {
        setMoving(null);
      }
    },
    [collectionSlug, config, documentId, order, productGroupId, routes.api, setMenuOpen, t],
  );

  if (!collectionSlug || !config || !documentId) {
    return <span className="yf-list-row-actions__empty">—</span>;
  }

  const hasMoveActions = Boolean(config.orderField);
  const canMove = hasMoveActions && order !== null;
  const hasMenuActions = hasMoveActions || createLinks.length > 0;

  return (
    <div className="yf-list-row-actions" aria-label={t('操作')}>
      <div className="yf-list-row-actions__compound">
        {editHref ? (
          <a className="yf-list-row-actions__primary" href={editHref}>
            {t('编辑')}
          </a>
        ) : null}
        <div className="yf-list-row-actions__menu">
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="yf-list-row-actions__trigger"
            disabled={!hasMenuActions}
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span>{t({ en: 'More', zh: '更多操作' })}</span>
            <span aria-hidden="true" className="yf-list-row-actions__chevron">
              ▾
            </span>
          </button>
          {menuOpen ? (
            <div
              className="yf-list-row-actions__panel"
              role="menu"
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setMenuOpen(false);
                }
              }}
            >
              {hasMoveActions ? (
                <>
                  <button
                    className="yf-list-row-actions__menu-item"
                    disabled={!canMove || moving !== null}
                    role="menuitem"
                    type="button"
                    onClick={() => void moveRow('up')}
                  >
                    {moving === 'up' ? t('调整中') : t('上移')}
                  </button>
                  <button
                    className="yf-list-row-actions__menu-item"
                    disabled={!canMove || moving !== null}
                    role="menuitem"
                    type="button"
                    onClick={() => void moveRow('down')}
                  >
                    {moving === 'down' ? t('调整中') : t('下移')}
                  </button>
                </>
              ) : null}
              {hasMoveActions && createLinks.length > 0 ? (
                <span className="yf-list-row-actions__separator" role="presentation" />
              ) : null}
              {createLinks.map((action) => (
                <a
                  className="yf-list-row-actions__menu-item yf-list-row-actions__menu-item--secondary"
                  href={action.href}
                  key={action.key}
                  role="menuitem"
                >
                  {t(action.label)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {message ? <span className="yf-list-row-actions__message">{message}</span> : null}
    </div>
  );
}
