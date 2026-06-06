'use client';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function SeoDrawer() {
  return (
    <SectionFieldDrawer
      title="SEO 搜索优化"
      description="编辑搜索引擎和分享卡片优先读取的标题、描述、关键词和规范链接。不填写时前台会自动使用产品名称与介绍。"
      fields={[
        {
          path: 'seo.title',
          label: 'SEO 标题',
          kind: 'text',
          help: '建议 30-70 个字符，包含产品名称、用途或核心型号。',
        },
        {
          path: 'seo.description',
          label: 'SEO 描述',
          kind: 'textarea',
          help: '建议 80-160 个字符，概括产品用途、材料、标准或应用场景。',
        },
        {
          path: 'seo.keywords',
          label: 'SEO 关键词',
          kind: 'text',
          help: '用逗号分隔，例如：消防服, 阻燃防护服, firefighter suit。',
        },
        {
          path: 'seo.ogImage',
          label: '分享封面图',
          kind: 'relationship',
          localized: false,
          relationTo: 'media',
          help: '可选。微信、社媒或聊天软件分享时优先使用；不填则使用产品主图。',
        },
        {
          path: 'seo.canonical',
          label: '规范链接',
          kind: 'text',
          localized: false,
          help: '通常留空。只有需要指定搜索引擎主链接时再填写。',
        },
        {
          path: 'seo.noindex',
          label: '不让搜索引擎收录',
          kind: 'checkbox',
          localized: false,
          help: '一般不要勾选。勾选后该产品详情页会输出 noindex。',
        },
      ]}
    />
  );
}
