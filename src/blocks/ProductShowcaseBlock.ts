import type { Block } from 'payload';

export const ProductShowcaseBlock: Block = {
  slug: 'productShowcase',
  labels: {
    singular: 'Product Showcase Block',
    plural: 'Product Showcase Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'category',
      type: 'relationship',
      label: '旧产品分类（内部兼容）',
      relationTo: 'product-categories',
      admin: {
        hidden: true,
        description: '旧站遗留字段，新内容不要使用。',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      maxRows: 12,
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 12,
    },
  ],
};
