import type { Field } from 'payload/types';

import { navTargetOptions } from './options';

export const childNavItemFields: Field[] = [
  {
    name: 'label',
    type: 'text',
    localized: true,
    required: true,
  },
  {
    name: 'href',
    type: 'text',
    required: true,
  },
  {
    name: 'icon',
    type: 'upload',
    relationTo: 'media',
  },
  {
    name: 'target',
    type: 'select',
    options: navTargetOptions,
    defaultValue: '_self',
  },
];

export const navItemFields: Field[] = [
  ...childNavItemFields,
  {
    name: 'children',
    type: 'array',
    fields: childNavItemFields,
  },
];
