'use client';

import type { ProductDetailSectionProps } from '@/lib/content/buildSectionProps';

import { useAdminText } from '../adminUiLocale';

import { buildProductEditorSectionStatuses } from './utils/productEditorCompletion';

type ProductEditorSidebarProps = Readonly<{
  formValues?: Record<string, unknown>;
  navTitle: string;
  sections: ProductDetailSectionProps;
}>;

const statusLabel = {
  complete: '已填写',
  hidden: '前台不展示',
  missing: '缺内容',
} as const;

export function ProductEditorSidebar({
  formValues,
  navTitle,
  sections,
}: ProductEditorSidebarProps) {
  const t = useAdminText();
  const items = buildProductEditorSectionStatuses(sections, formValues);
  const completeCount = items.filter((item) => item.status === 'complete').length;

  return (
    <aside className="detail-sidebar ype-status-sidebar" aria-label={t(navTitle)}>
      <div className="detail-sidebar-title">
        <span>{t(navTitle)}</span>
        <strong>
          {completeCount}/{items.length}
        </strong>
      </div>
      <div className="detail-sidebar-nav-viewport">
        <nav className="detail-sidebar-nav ype-section-status-nav" aria-label={t(navTitle)}>
          {items.map((item, index) => (
            <a
              key={item.id}
              className={`detail-sidebar-link ype-section-status-link is-${item.status}`}
              href={`#${item.id}`}
              title={t(item.emptyHint)}
            >
              <span className="ype-section-status-copy">
                <span>{t(item.label)}</span>
                <small>{t(statusLabel[item.status])}</small>
              </span>
              <em>{String(index + 1).padStart(2, '0')}</em>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
