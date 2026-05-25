import type { Block } from 'payload/types';

export const MediaTextBlock: Block = {
  slug: 'mediaText',
  labels: {
    singular: 'Media Text Block',
    plural: 'Media Text Blocks',
  },
  fields: [
    {
      name: 'layout',
      type: 'select',
      options: ['media-left', 'media-right'],
      defaultValue: 'media-left',
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'ctaHref',
      type: 'text',
    },
  ],
};
