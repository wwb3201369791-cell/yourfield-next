import type { EditorSection } from '../hooks/useEditorContext';

export function focusDrawerField(path: string) {
  if (!path || typeof document === 'undefined') {
    return;
  }

  const escape =
    typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(path) : path.replace(/"/g, '\\"');
  const wrapper = document.querySelector(`[data-ype-path="${escape}"]`);
  const focusTarget = wrapper?.querySelector<HTMLElement>(
    'input, textarea, select, button, [tabindex]',
  );

  focusTarget?.focus?.();
}

export function openDrawerAndFocus(
  openDrawer: (section: EditorSection) => void,
  section: EditorSection,
  path: string,
  delay = 80,
) {
  openDrawer(section);

  if (typeof window !== 'undefined') {
    window.setTimeout(() => focusDrawerField(path), delay);
  }
}
