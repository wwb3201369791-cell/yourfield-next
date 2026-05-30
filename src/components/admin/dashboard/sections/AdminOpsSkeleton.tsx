'use client';

import { useAdminText } from '../../adminUiLocale';

export function AdminOpsSkeleton() {
  const t = useAdminText();

  return (
    <section className="yourfield-ops-dashboard yourfield-ops-dashboard--loading">
      <div className="yourfield-ops-dashboard__visual" aria-hidden="true" />
      <div className="yourfield-ops-dashboard__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">{t('运营数据')}</p>
          <h2>{t('网站运营看板')}</h2>
        </div>
        <span className="yourfield-ops-pill">{t('加载中')}</span>
      </div>
      <div className="yourfield-ops-skeleton-grid" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
    </section>
  );
}
