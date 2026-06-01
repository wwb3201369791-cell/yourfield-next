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
  rowData?: Readonly<Record<string, unknown>>;
}>;

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

export default function AdminListRowActionsCell({ rowData }: CellProps) {
  const t = useAdminText();
  const {
    config: { routes },
  } = useConfig();
  const [moving, setMoving] = useState<AdminListRowActionDirection | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const collectionSlug = currentCollectionSlug();
  const config = collectionSlug ? adminListRowActionConfig[collectionSlug] : null;
  const documentId = rowActionDocumentId(rowData);
  const order = config ? rowActionOrderValue(rowData, config.orderField) : null;
  const productGroupId = rowActionProductGroupId(rowData);
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
      if (!collectionSlug || !config || !documentId || order === null) {
        return;
      }

      setMoving(direction);
      setMessage(null);

      try {
        const neighborResponse = await fetch(
          buildNeighborLookupUrl({
            apiBase: routes.api,
            collectionSlug,
            direction,
            order,
            orderField: config.orderField,
            productGroupId: config.scopeByProductGroup ? productGroupId : null,
          }),
          { credentials: 'include' },
        );

        if (!neighborResponse.ok) {
          throw new Error(`neighbor:${neighborResponse.status}`);
        }

        const neighborDoc = neighborDocFromApiResponse(await readJson(neighborResponse));
        const neighborId = rowActionDocumentId(neighborDoc);
        const neighborOrder = rowActionOrderValue(neighborDoc, config.orderField);

        if (!neighborId || neighborOrder === null) {
          setMessage(t(direction === 'up' ? '已经是第一位' : '已经是最后一位'));
          return;
        }

        const patchOptions = (nextOrder: number) => ({
          body: JSON.stringify({ [config.orderField]: nextOrder }),
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
    [collectionSlug, config, documentId, order, productGroupId, routes.api, t],
  );

  if (!collectionSlug || !config || !documentId) {
    return <span className="yf-list-row-actions__empty">—</span>;
  }

  const canMove = order !== null;

  return (
    <div className="yf-list-row-actions" aria-label={t('操作')}>
      {editHref ? (
        <a className="yf-list-row-actions__button" href={editHref}>
          {t('编辑')}
        </a>
      ) : null}
      <button
        className="yf-list-row-actions__button"
        disabled={!canMove || moving !== null}
        type="button"
        onClick={() => void moveRow('up')}
      >
        {moving === 'up' ? t('调整中') : t('上移')}
      </button>
      <button
        className="yf-list-row-actions__button"
        disabled={!canMove || moving !== null}
        type="button"
        onClick={() => void moveRow('down')}
      >
        {moving === 'down' ? t('调整中') : t('下移')}
      </button>
      {createLinks.map((action) => (
        <a
          className="yf-list-row-actions__button yf-list-row-actions__button--secondary"
          href={action.href}
          key={action.key}
        >
          {t(action.label)}
        </a>
      ))}
      {message ? <span className="yf-list-row-actions__message">{message}</span> : null}
    </div>
  );
}
