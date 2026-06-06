'use client';

import { useEffect, type ComponentType } from 'react';

import { useAdminText } from '../adminUiLocale';

import { useEditorContext, type EditorSection } from './hooks/useEditorContext';

type DrawerComponent = ComponentType;

const drawerRegistry = new Map<EditorSection, DrawerComponent>();

const drawerLabels: Record<EditorSection, string> = {
  care: '洗护与维护',
  evidence: '资料与认证状态',
  faq: '常见问题',
  hero: '主图与简介',
  identity: '展示顺序',
  intro: '商品介绍',
  scenarios: '适用场景',
  'selling-points': '核心卖点',
  'size-guide': '尺码对应表',
  specifications: '参数规格',
  'visual-groups': '场景图、建模图与模特上身图',
};

export function registerDrawer(section: EditorSection, Component: DrawerComponent) {
  drawerRegistry.set(section, Component);
}

export function SectionDrawer() {
  const t = useAdminText();
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
    <aside
      className="ype-drawer open"
      aria-label={t({ en: 'Product editor drawer', zh: '产品编辑抽屉' })}
    >
      <header className="ype-drawer-header">
        <span>{t(drawerLabels[openSection])}</span>
        <button type="button" aria-label={t('关闭')} onClick={closeDrawer}>
          ×
        </button>
      </header>
      <div className="ype-drawer-body">
        {DrawerBody ? (
          <DrawerBody />
        ) : (
          <p>
            {t({ en: 'This section drawer is not implemented yet.', zh: '该区块的抽屉尚未实现。' })}
          </p>
        )}
      </div>
    </aside>
  );
}
