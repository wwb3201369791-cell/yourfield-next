import type { SidebarNavProps } from './types';

export function ProductSidebarNav({ items, navTitle }: SidebarNavProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="detail-sidebar" aria-label={navTitle}>
      <div className="detail-sidebar-title">
        <span>{navTitle}</span>
        <strong>{items.length}</strong>
      </div>
      <div className="detail-sidebar-nav-viewport">
        <nav className="detail-sidebar-nav" aria-label={navTitle}>
          {items.map((item, index) => (
            <a key={item.id} className="detail-sidebar-link" href={`#${item.id}`}>
              <span>{item.label}</span>
              <em>{String(index + 1).padStart(2, '0')}</em>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
