import { useAdminText } from '../../adminUiLocale';
import type { DashboardFormSummary } from '../types';

type FormSubmissionsListProps = Readonly<{
  adminBase: string;
  forms: DashboardFormSummary[];
}>;

export function FormSubmissionsList({ adminBase, forms }: FormSubmissionsListProps) {
  const t = useAdminText();

  return (
    <article className="yourfield-ops-panel yourfield-ops-panel--forms">
      <div className="yourfield-ops-panel__head">
        <div>
          <h3>{t('最近询盘')}</h3>
          <p>{t('客户提交的留言与询盘,按提交时间倒序。')}</p>
        </div>
        <a
          className="yourfield-ops-panel-link yourfield-ops-panel-link--forms"
          href={`${adminBase}/collections/form-submissions`}
        >
          <span aria-hidden="true" />
          <span>{t('查看表单')}</span>
        </a>
      </div>
      <div className="yourfield-ops-leads" aria-label={t('最近咨询表单')}>
        {forms.length > 0 ? (
          forms.map((form, index) => (
            <div key={`${form.name}-${index}`}>
              <span>{form.status === 'new' ? t('新') : t('进')}</span>
              <strong>{form.name}</strong>
              <em>{form.meta}</em>
            </div>
          ))
        ) : (
          <p className="yourfield-ops-empty">{t('还没有咨询表单。')}</p>
        )}
      </div>
    </article>
  );
}
