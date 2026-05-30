'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type EditorSection =
  | 'hero'
  | 'intro'
  | 'selling-points'
  | 'specifications'
  | 'size-guide'
  | 'scenarios'
  | 'visual-groups'
  | 'evidence'
  | 'care'
  | 'faq'
  | 'identity';

export type EditorMode = 'edit' | 'preview';

type EditorContextValue = Readonly<{
  allLocaleDoc: Record<string, unknown> | null;
  closeDrawer: () => void;
  mode: EditorMode;
  openDrawer: (section: EditorSection) => void;
  openSection: EditorSection | null;
  previewMode: boolean;
  setAllLocaleDoc: (doc: Record<string, unknown> | null) => void;
  setMode: (mode: EditorMode) => void;
  setPreviewMode: (previewMode: boolean) => void;
}>;

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [openSection, setOpenSection] = useState<EditorSection | null>(null);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [allLocaleDoc, setAllLocaleDoc] = useState<Record<string, unknown> | null>(null);
  const previewMode = mode === 'preview';

  const value = useMemo<EditorContextValue>(
    () => ({
      allLocaleDoc,
      closeDrawer: () => setOpenSection(null),
      mode,
      openDrawer: (section) => setOpenSection(section),
      openSection,
      previewMode,
      setAllLocaleDoc,
      setMode,
      setPreviewMode: (nextPreviewMode) => setMode(nextPreviewMode ? 'preview' : 'edit'),
    }),
    [allLocaleDoc, mode, openSection, previewMode],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorContext() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditorContext must be used inside EditorProvider');
  }

  return context;
}
