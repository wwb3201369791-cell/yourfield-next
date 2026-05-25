 'use client';

import React, { useEffect, type ComponentType } from 'react';

import { useEditorContext, type EditorSection } from './hooks/useEditorContext';

type DrawerComponent = ComponentType;

const drawerRegistry = new Map<EditorSection, DrawerComponent>();

export function registerDrawer(section: EditorSection, Component: DrawerComponent) {
  drawerRegistry.set(section, Component);
}

export function SectionDrawer() {
  const { closeDrawer, openSection } = useEditorContext();

  useEffect(() => {
    if (!openSection) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    };

    document.body.classList.add('ype-drawer-open');
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('ype-drawer-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeDrawer, openSection]);

  if (!openSection) {
    return null;
  }

  const DrawerBody = drawerRegistry.get(openSection);

  return (
    <aside className="ype-drawer open" aria-label="产品编辑抽屉">
      <header className="ype-drawer-header">
        <span>{openSection}</span>
        <button type="button" aria-label="关闭" onClick={closeDrawer}>
          ×
        </button>
      </header>
      <div className="ype-drawer-body">
        {DrawerBody ? <DrawerBody /> : <p>该区块的抽屉尚未实现。</p>}
      </div>
    </aside>
  );
}
