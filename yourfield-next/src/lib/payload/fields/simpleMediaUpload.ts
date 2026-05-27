import type { UploadField } from 'payload/types';

import SimpleMediaUploadField from '@/components/admin/media-upload/SimpleMediaUploadField';

type UploadFieldAdmin = NonNullable<UploadField['admin']>;

export function imageUploadAdmin(admin: UploadFieldAdmin = {}): UploadFieldAdmin {
  return {
    ...admin,
    components: {
      ...(admin?.components ?? {}),
      Field: SimpleMediaUploadField,
    },
  };
}

export function imageUploadField(field: Omit<UploadField, 'relationTo' | 'type'>): UploadField {
  return {
    ...field,
    type: 'upload',
    relationTo: 'media',
    admin: imageUploadAdmin(field.admin ?? {}),
  };
}
