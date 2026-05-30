'use client';

import { type ReactNode } from 'react';

import { useAdminText } from '../adminUiLocale';

import { useEditorContext, type EditorSection } from './hooks/useEditorContext';

type Props = Readonly<{
  children?: ReactNode;
  emptyHint?: string;
  emptyTitle?: string;
  isEmpty?: boolean;
  label: string;
  section: EditorSection;
}>;

export function EditableShell({
  children,
  emptyHint,
  emptyTitle,
  isEmpty = false,
  label,
  section,
}: Props) {
  const t = useAdminText();
  const { openDrawer, openSection, previewMode } = useEditorContext();
  const editing = openSection === section;

  if (previewMode) {
    return isEmpty ? null : <>{children}</>;
  }

  if (isEmpty && !children) {
    return (
      <button type="button" className="ype-empty-add" onClick={() => openDrawer(section)}>
        <span className="ype-empty-add-icon">＋</span>
        <span className="ype-empty-add-title">
          {emptyTitle ?? t({ en: `Add ${label}`, zh: `添加${label}` })}
        </span>
        {emptyHint ? <span className="ype-empty-add-hint">{emptyHint}</span> : null}
      </button>
    );
  }

  return (
    <div
      className={`ype-editable ${editing ? 'is-editing' : ''} ${isEmpty ? 'is-empty' : ''}`}
      data-ype-section={section}
    >
      {children}
    </div>
  );
}
