'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { useAdminText } from '../../adminUiLocale';

type AdminOpsErrorProps = Readonly<{
  message: string;
  onRetry: () => void;
}>;

export function AdminOpsError({ message, onRetry }: AdminOpsErrorProps) {
  const t = useAdminText();

  return (
    <section className="yourfield-ops-dashboard yourfield-ops-dashboard--error">
      <div className="yourfield-ops-dashboard__visual" aria-hidden="true" />
      <div className="yourfield-ops-dashboard__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">{t('运营数据')}</p>
          <h2>{t('网站运营看板')}</h2>
          <p>{t('统计数据暂时不可用，基础内容管理仍可继续使用。')}</p>
        </div>
        <button className="yourfield-ops-refresh" type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{t('重新加载')}</span>
        </button>
      </div>
      <div className="yourfield-ops-error-card" role="status">
        <span className="yourfield-ops-error-card__icon" aria-hidden="true">
          <AlertTriangle size={18} strokeWidth={2.2} />
        </span>
        <span className="yourfield-ops-error-card__body">
          <strong>{t('后台统计接口没有返回完整数据')}</strong>
          <span>{t('这通常和本地数据库迁移或临时服务状态有关，不影响下方集合入口。')}</span>
          <small>{message}</small>
        </span>
      </div>
    </section>
  );
}
