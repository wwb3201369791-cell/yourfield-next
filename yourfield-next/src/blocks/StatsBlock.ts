import type { Block } from 'payload/types';

export const StatsBlock: Block = {
  slug: 'stats',
  labels: {
    singular: 'Stats Block',
    plural: 'Stats Blocks',
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
        },
      ],
    },
  ],
};
