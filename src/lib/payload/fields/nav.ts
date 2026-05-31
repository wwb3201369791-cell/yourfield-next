import type { Field } from 'payload';

import { adminLabel } from '../adminText';

import { navTargetOptions } from './options';
import { imageUploadField } from './simpleMediaUpload';

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
  imageUploadField({
    name: 'icon',
    label: adminLabel('图标'),
  }),
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
