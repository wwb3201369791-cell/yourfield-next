 'use client';

import React, { type ReactNode } from 'react';

import { EditorToolbar } from './EditorToolbar';
import { SectionDrawer } from './SectionDrawer';
import { EditorProvider } from './hooks/useEditorContext';
import '@/styles/admin-product-editor.css';

type Props = Readonly<{
  canvas: ReactNode;
  sidebar: ReactNode;
}>;

export function EditorShell({ canvas, sidebar }: Props) {
  return (
    <EditorProvider>
      <div className="ype-root">
        <EditorToolbar />
        <div className="ype-shell">
          <aside className="ype-sidebar">{sidebar}</aside>
          <main className="ype-canvas-wrap">
            <div className="ype-canvas-inner">{canvas}</div>
          </main>
          <SectionDrawer />
        </div>
      </div>
    </EditorProvider>
  );
}
