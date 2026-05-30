'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { EditorToolbar } from './EditorToolbar';
import { SectionDrawer } from './SectionDrawer';
import { EditorProvider, useEditorContext } from './hooks/useEditorContext';
import '@/styles/legacy-product-detail.css';
import '@/styles/admin-product-editor.css';

type Props = Readonly<{
  canvas: ReactNode;
  sidebar: ReactNode;
}>;

export function EditorShell({ canvas, sidebar }: Props) {
  return (
    <EditorProvider>
      <EditorWorkspace canvas={canvas} sidebar={sidebar} />
    </EditorProvider>
  );
}

function EditorWorkspace({ canvas, sidebar }: Props) {
  const { openSection } = useEditorContext();
  const drawerOpenClass = openSection ? 'is-drawer-open' : '';
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const toolbar = root?.querySelector<HTMLElement>('.ype-toolbar');

    if (!root || !toolbar) {
      return undefined;
    }

    let animationFrame = 0;
    const syncToolbarHeight = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const height = Math.ceil(toolbar.getBoundingClientRect().height);
        root.style.setProperty('--ype-toolbar-height', `${height}px`);
      });
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncToolbarHeight);

    syncToolbarHeight();
    resizeObserver?.observe(toolbar);
    window.addEventListener('resize', syncToolbarHeight);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncToolbarHeight);
    };
  }, []);

  return (
    <div ref={rootRef} className="ype-root">
      <EditorToolbar />
      <div className={`ype-shell ${drawerOpenClass}`}>
        <aside className="ype-sidebar">{sidebar}</aside>
        <main className="ype-canvas-wrap">
          <div className="ype-canvas-inner">{canvas}</div>
        </main>
        <SectionDrawer />
      </div>
    </div>
  );
}
