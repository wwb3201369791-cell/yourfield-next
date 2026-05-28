'use client';

import { InlineStringList, InlineTextField } from '../inline/InlineControls';

export function InlineProductIntroEditor() {
  return (
    <section className="ype-inline-editor">
      <div className="detail-section-heading">
        <h2>商品介绍</h2>
      </div>
      <InlineTextField
        label="概述"
        path="description"
        multiline
        rows={4}
        placeholder="输入产品概述，会同步显示在详情页商品介绍和首屏简介。"
      />
      <div className="ype-inline-grid">
        <InlineStringList label="材料" path="materials" placeholder="例如：阻燃面料" />
        <InlineStringList
          itemKey="title"
          label="产品特点"
          path="features"
          placeholder="例如：耐磨、轻量、透气"
        />
        <InlineStringList label="适用场景" path="applications" placeholder="例如：消防救援" />
      </div>
    </section>
  );
}
