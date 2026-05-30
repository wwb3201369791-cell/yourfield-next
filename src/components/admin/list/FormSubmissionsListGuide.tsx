'use client';

import { useAdminText } from '../adminUiLocale';

export function FormSubmissionsListGuide() {
  const t = useAdminText();

  return (
    <aside className="yf-form-submissions-guide" aria-label={t('处理提示')}>
      <div className="yf-form-submissions-guide__copy">
        <strong>{t('处理提示')}</strong>
        <span>{t('少量咨询时也保留操作节奏：先回访新咨询，再在详情里补充负责人和跟进记录。')}</span>
      </div>
      <ol className="yf-form-submissions-guide__steps">
        <li>{t('新咨询优先回访')}</li>
        <li>{t('处理中记录负责人')}</li>
        <li>{t('已回复 / 已关闭用于归档')}</li>
      </ol>
      <div className="yf-form-submissions-guide__footer">
        <span>{t('少量记录时，优先从详情页补齐负责人、来源和跟进备注。')}</span>
        <strong>{t('处理顺序：新咨询 → 处理中 → 已回复 / 已关闭')}</strong>
      </div>
    </aside>
  );
}
