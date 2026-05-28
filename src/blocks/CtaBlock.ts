import type { Block } from 'payload/types';

export const CtaBlock: Block = {
  slug: 'cta',
  labels: {
    singular: 'CTA Block',
    plural: 'CTA Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'primaryLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'primaryHref',
      type: 'text',
    },
    {
      name: 'secondaryLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'secondaryHref',
      type: 'text',
    },
  ],
};
