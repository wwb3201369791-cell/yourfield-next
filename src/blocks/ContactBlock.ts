import type { Block } from 'payload';

export const ContactBlock: Block = {
  slug: 'contact',
  labels: {
    singular: 'Contact Block',
    plural: 'Contact Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'showForm',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showMap',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
