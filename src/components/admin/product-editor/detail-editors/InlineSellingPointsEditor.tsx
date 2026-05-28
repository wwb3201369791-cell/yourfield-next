'use client';

import { InlineCardList } from '../inline/InlineControls';

export function InlineSellingPointsEditor() {
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>核心卖点</h2>
      </div>
      <InlineCardList
        addLabel="核心卖点"
        descriptionLabel="说明"
        path="sellingPoints"
        titleLabel="卖点标题"
      />
    </section>
  );
}
