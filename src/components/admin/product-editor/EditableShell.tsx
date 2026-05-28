'use client';

import React, { type ReactNode } from 'react';

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
  const { openSection, previewMode } = useEditorContext();
  const editing = openSection === section;

  if (previewMode) {
    return isEmpty ? null : <>{children}</>;
  }

  if (isEmpty && !children) {
    return (
      <div className="ype-empty-add">
        <span className="ype-empty-add-icon">＋</span>
        <span className="ype-empty-add-title">{emptyTitle ?? `添加${label}`}</span>
        {emptyHint ? <span className="ype-empty-add-hint">{emptyHint}</span> : null}
      </div>
    );
  }

  return (
    <div
      className={`ype-editable ${editing ? 'is-editing' : ''} ${isEmpty ? 'is-empty' : ''}`}
      data-ype-section={section}
    >
      <span className="ype-editable-label">编辑：{label}</span>
      {children}
    </div>
  );
}
