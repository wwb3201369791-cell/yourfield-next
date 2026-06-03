'use client';

import { useConfig, useDocumentInfo, useForm } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

import type { Locale } from '@/lib/i18n/locale';

import {
  buildProductDocumentHydrationUrl,
  claimProductHydrationAttempt,
  getProductDocumentIdFromPathname,
  normalizeProductDocumentForFormReset,
  releasePendingProductHydrationAttempt,
} from '../utils/productEditorHydration';

export function useHydratedProductDocument(currentLocale: Locale) {
  const {
    config: { routes },
  } = useConfig();
  const { id } = useDocumentInfo();
  const { reset } = useForm();
  const [hydratedDoc, setHydratedDoc] = useState<Record<string, unknown> | null>(null);
  const hydratedKeyRef = useRef('');

  useEffect(() => {
    const documentId =
      id && String(id).trim()
        ? String(id)
        : typeof window !== 'undefined'
          ? getProductDocumentIdFromPathname(window.location.pathname)
          : '';

    if (!documentId) {
      setHydratedDoc(null);
      hydratedKeyRef.current = '';
      return undefined;
    }

    const hydrationKey = `${String(documentId)}:${currentLocale}`;
    if (!claimProductHydrationAttempt(hydratedKeyRef, hydrationKey)) {
      return undefined;
    }

    let completed = false;
    const controller = new AbortController();
    const apiBase = routes.api;
    const url = buildProductDocumentHydrationUrl({
      apiBase,
      id: documentId,
      locale: currentLocale,
    });

    void fetch(url, { credentials: 'include', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((doc) => {
        if (controller.signal.aborted) {
          return;
        }

        completed = true;
        if (doc && typeof doc === 'object') {
          const hydratedProduct = doc as Record<string, unknown>;
          setHydratedDoc(hydratedProduct);
          void reset(normalizeProductDocumentForFormReset(hydratedProduct)).catch(() => undefined);
          return;
        }

        if (hydratedKeyRef.current === hydrationKey) {
          hydratedKeyRef.current = '';
        }
        setHydratedDoc(null);
      })
      .catch(() => {
        if (!controller.signal.aborted && hydratedKeyRef.current === hydrationKey) {
          completed = true;
          hydratedKeyRef.current = '';
          setHydratedDoc(null);
        }
      });

    return () => {
      controller.abort();
      releasePendingProductHydrationAttempt(hydratedKeyRef, hydrationKey, completed);
    };
  }, [currentLocale, id, reset, routes.api]);

  return hydratedDoc;
}
