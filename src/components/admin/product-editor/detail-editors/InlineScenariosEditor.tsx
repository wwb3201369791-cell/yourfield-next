'use client';

import { useAdminText } from '../../adminUiLocale';
import { InlineCardList, InlineStringList } from '../inline/InlineControls';

export function InlineScenariosEditor() {
  const t = useAdminText();
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>{t('适用场景')}</h2>
      </div>
      <InlineCardList
        addLabel="场景卡片"
        descriptionKey="description"
        descriptionLabel="场景说明"
        path="scenarios"
        titleLabel="场景标题"
      />
      <InlineStringList
        label="适用场景文本"
        path="applications"
        placeholder="没有卡片时，也可以先填一句场景文本。"
      />
    </section>
  );
}
