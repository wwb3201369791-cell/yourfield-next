import type { Block } from 'payload';

export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqContentBlock',
  labels: {
    singular: 'FAQ Block',
    plural: 'FAQ Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
    },
  ],
};
