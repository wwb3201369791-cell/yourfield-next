import { useAdminText } from '../../adminUiLocale';
import { numberFormat, safeNumber } from '../format';
import type { TopKeyword } from '../types';

type TopKeywordsTableProps = Readonly<{
  apiBase: string;
  topKeywords: TopKeyword[];
  zeroResultSearches: number;
}>;

export function TopKeywordsTable({
  apiBase,
  topKeywords,
  zeroResultSearches,
}: TopKeywordsTableProps) {
  const t = useAdminText();

  return (
    <article className="yourfield-ops-panel yourfield-ops-panel--keywords">
      <div className="yourfield-ops-panel__head">
        <div>
          <h3>{t('热门搜索')}</h3>
          <p>{t('最近用户在站内搜索过的关键词。')}</p>
        </div>
        <div className="yourfield-ops-panel__actions">
          {zeroResultSearches > 0 ? (
            <span className="yourfield-ops-pill">
              {t('零结果')} {numberFormat(zeroResultSearches)}
            </span>
          ) : null}
          <a
            className="yourfield-ops-panel-link yourfield-ops-panel-link--stats"
            href={`${apiBase}/search-logs/stats-view?limit=100`}
          >
            <span aria-hidden="true" />
            <span>{t('查看统计')}</span>
          </a>
        </div>
      </div>
      <div className="yourfield-ops-keywords" aria-label={t('热门搜索关键词')}>
        {topKeywords.length > 0 ? (
          topKeywords.map((keyword, index) => (
            <div key={`${keyword.query}-${index}`}>
              <span>{index + 1}</span>
              <strong>{keyword.query || t('未命名关键词')}</strong>
              <em>
                {t({
                  en: `${numberFormat(keyword.searches)} searches`,
                  zh: `${numberFormat(keyword.searches)} 次`,
                })}
                {safeNumber(keyword.zeroResultSearches) > 0
                  ? t({
                      en: `, zero results ${numberFormat(keyword.zeroResultSearches)}`,
                      zh: `，零结果 ${numberFormat(keyword.zeroResultSearches)}`,
                    })
                  : ''}
              </em>
            </div>
          ))
        ) : (
          <p className="yourfield-ops-empty">{t('还没有可展示的实时搜索。')}</p>
        )}
      </div>
    </article>
  );
}
