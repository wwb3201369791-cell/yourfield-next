 'use client';

import React, { type ReactNode } from 'react';

import { EditableShell } from './EditableShell';
import type { EditorSection } from './hooks/useEditorContext';

type Props = Readonly<{
  children?: ReactNode;
  emptyHint?: string;
  id: string;
  isEmpty?: boolean;
  label: string;
  section: EditorSection;
}>;

export function CanvasSection({ children, emptyHint, id, isEmpty, label, section }: Props) {
  const editableProps = {
    section,
    label,
    ...(typeof isEmpty === 'boolean' ? { isEmpty } : {}),
    ...(emptyHint ? { emptyHint } : {}),
  };

  return (
    <section className="ype-canvas-section" id={id}>
      <EditableShell {...editableProps}>
        {children}
      </EditableShell>
    </section>
  );
}
