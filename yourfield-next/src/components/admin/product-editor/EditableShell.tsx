 'use client';

import React, { type KeyboardEvent, type ReactNode } from 'react';

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
  const { openDrawer, openSection, previewMode } = useEditorContext();
  const editing = openSection === section;

  if (previewMode) {
    return isEmpty ? null : <>{children}</>;
  }

  if (isEmpty) {
    return (
      <button className="ype-empty-add" type="button" onClick={() => openDrawer(section)}>
        <span className="ype-empty-add-icon">＋</span>
        <span className="ype-empty-add-title">{emptyTitle ?? `添加${label}`}</span>
        {emptyHint ? <span className="ype-empty-add-hint">{emptyHint}</span> : null}
      </button>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDrawer(section);
    }
  };

  return (
    <div
      className={`ype-editable ${editing ? 'is-editing' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => openDrawer(section)}
      onKeyDown={onKeyDown}
    >
      <span className="ype-editable-label">编辑：{label}</span>
      {children}
    </div>
  );
}
