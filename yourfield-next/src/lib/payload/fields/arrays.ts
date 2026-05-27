import type { Field } from 'payload/types';

import { imageUploadField } from './simpleMediaUpload';

type TextArrayArgs = {
  name: string;
  label?: string;
  localized?: boolean;
  required?: boolean;
  minRows?: number;
  maxRows?: number;
};

type OptionalArrayPropsArgs = {
  label?: string | undefined;
  maxRows?: number | undefined;
  minRows?: number | undefined;
};

const optionalArrayProps = ({ label, minRows, maxRows }: OptionalArrayPropsArgs) => ({
  ...(label ? { label } : {}),
  ...(typeof minRows === 'number' ? { minRows } : {}),
  ...(typeof maxRows === 'number' ? { maxRows } : {}),
});

export const textArrayField = ({
  name,
  label,
  localized = false,
  required = false,
  minRows,
  maxRows,
}: TextArrayArgs): Field => ({
  name,
  ...optionalArrayProps({ label, minRows, maxRows }),
  type: 'array',
  localized,
  required,
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
    },
  ],
});

export const textareaArrayField = ({
  name,
  label,
  localized = false,
  required = false,
  minRows,
  maxRows,
}: TextArrayArgs): Field => ({
  name,
  ...optionalArrayProps({ label, minRows, maxRows }),
  type: 'array',
  localized,
  required,
  fields: [
    {
      name: 'value',
      type: 'textarea',
      required: true,
    },
  ],
});

export const uploadArrayField = ({
  name,
  label,
  minRows,
  maxRows,
  required = false,
}: Omit<TextArrayArgs, 'localized'>): Field => ({
  name,
  ...optionalArrayProps({ label, minRows, maxRows }),
  type: 'array',
  required,
  fields: [imageUploadField({ name: 'file', label: '图片', required: true })],
});
