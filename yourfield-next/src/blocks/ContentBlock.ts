import type { Block } from 'payload/types';

export const ContentBlock: Block = {
  slug: 'content',
  labels: {
    singular: 'Content Block',
    plural: 'Content Blocks',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      localized: true,
      required: true,
    },
  ],
};
