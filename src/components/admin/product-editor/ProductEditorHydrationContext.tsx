'use client';

import { createContext, useContext } from 'react';

import { valueAtPath } from './utils/payloadFieldArrayRows';

export const ProductEditorHydrationContext = createContext<Record<string, unknown> | null>(null);

export function useHydratedProductDocumentValue(path: string) {
  const hydratedDocument = useContext(ProductEditorHydrationContext);

  return hydratedDocument ? valueAtPath(hydratedDocument, path) : undefined;
}
