import type { Block } from 'payload';

export const NewsListBlock: Block = {
  slug: 'newsList',
  labels: {
    singular: 'News List Block',
    plural: 'News List Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'category',
      type: 'select',
      options: ['news', 'event', 'announcement', 'exhibition'],
    },
    {
      name: 'news',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
      maxRows: 10,
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 10,
    },
  ],
};
