import type { Field } from 'payload/types';

type SeoGroupArgs = {
  label?: string;
  name?: string;
};

export const createSeoGroup = ({ label, name = 'seo' }: SeoGroupArgs = {}): Field => ({
  name,
  ...(label ? { label } : {}),
  type: 'group',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'SEO 标题（可选）',
      localized: true,
      maxLength: 70,
      admin: {
        description: '显示在浏览器标题和搜索结果标题里；不填时通常会使用页面名称。',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'SEO 描述（可选）',
      localized: true,
      maxLength: 200,
      admin: {
        description: '搜索结果里的摘要文案，建议控制在 200 字以内。',
      },
    },
    {
      name: 'keywords',
      type: 'text',
      label: 'SEO 关键词（可选）',
      localized: true,
      admin: {
        description: '用逗号分隔，建议 3-7 个。现在搜索引擎不强依赖它，填核心词即可。',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      label: '分享封面图（可选）',
      relationTo: 'media',
      admin: {
        description: '页面被分享到微信、社媒或聊天软件时，可能会作为预览图。',
      },
    },
    {
      name: 'noindex',
      type: 'checkbox',
      label: '不让搜索引擎收录',
      defaultValue: false,
      admin: {
        description: '一般不要开启。开启后，这个页面会尽量不出现在搜索结果里。',
      },
    },
    {
      name: 'canonical',
      type: 'text',
      label: '规范链接（可选）',
      admin: {
        description: '用于告诉搜索引擎哪个地址是主版本；不懂可以留空。',
      },
    },
  ],
});

export const seoGroup = createSeoGroup();
