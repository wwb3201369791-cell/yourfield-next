import React from 'react';

type AdminOpsErrorProps = Readonly<{
  message: string;
  onRetry: () => void;
}>;

export function AdminOpsError({ message, onRetry }: AdminOpsErrorProps) {
  return (
    <section className="yourfield-ops-dashboard yourfield-ops-dashboard--error">
      <div className="yourfield-ops-dashboard__visual" aria-hidden="true" />
      <div className="yourfield-ops-dashboard__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">运营数据</p>
          <h2>网站运营看板</h2>
          <p>暂时没有取到后台统计数据。</p>
        </div>
        <button className="yourfield-ops-refresh" type="button" onClick={onRetry}>
          <span className="yourfield-ops-refresh__icon" aria-hidden="true" />
          <span>重新加载</span>
        </button>
      </div>
      <p className="yourfield-ops-error-text">{message}</p>
    </section>
  );
}
