 'use client';

import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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
  | 'operations';

export type EditorMode = 'edit' | 'preview';

type EditorContextValue = Readonly<{
  closeDrawer: () => void;
  mode: EditorMode;
  openDrawer: (section: EditorSection) => void;
  openSection: EditorSection | null;
  previewMode: boolean;
  setMode: (mode: EditorMode) => void;
  setPreviewMode: (previewMode: boolean) => void;
}>;

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [openSection, setOpenSection] = useState<EditorSection | null>(null);
  const [mode, setMode] = useState<EditorMode>('edit');
  const previewMode = mode === 'preview';

  const value = useMemo<EditorContextValue>(
    () => ({
      closeDrawer: () => setOpenSection(null),
      mode,
      openDrawer: (section) => setOpenSection(section),
      openSection,
      previewMode,
      setMode,
      setPreviewMode: (nextPreviewMode) => setMode(nextPreviewMode ? 'preview' : 'edit'),
    }),
    [mode, openSection, previewMode],
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
