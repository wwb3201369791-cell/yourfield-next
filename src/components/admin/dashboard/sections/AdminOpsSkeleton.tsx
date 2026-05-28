import React from 'react';

export function AdminOpsSkeleton() {
  return (
    <section className="yourfield-ops-dashboard yourfield-ops-dashboard--loading">
      <div className="yourfield-ops-dashboard__visual" aria-hidden="true" />
      <div className="yourfield-ops-dashboard__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">运营数据</p>
          <h2>网站运营看板</h2>
        </div>
        <span className="yourfield-ops-pill">加载中</span>
      </div>
      <div className="yourfield-ops-skeleton-grid" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
    </section>
  );
}
