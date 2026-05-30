'use client';

import { useAdminText } from '../../adminUiLocale';
import { InlineStringList } from '../inline/InlineControls';

export function InlineCareEditor() {
  const t = useAdminText();
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>{t('洗护与维护')}</h2>
      </div>
      <InlineStringList label="洗护说明" path="careInstructions" placeholder="输入一条洗护说明" />
    </section>
  );
}
