import type { UploadField } from 'payload';

type UploadFieldAdmin = NonNullable<UploadField['admin']>;
type MediaUploadKind = 'image' | 'video';

function mediaUploadAdmin(admin: UploadFieldAdmin = {}): UploadFieldAdmin {
  return {
    ...admin,
    components: {
      ...(admin?.components ?? {}),
      Field: '@/components/admin/media-upload/SimpleMediaUploadField',
    },
  };
}

function mediaUploadField(
  field: Omit<UploadField, 'relationTo' | 'type'>,
  mediaKind: MediaUploadKind,
): UploadField {
  return {
    ...field,
    type: 'upload',
    relationTo: 'media',
    custom: {
      ...(field.custom ?? {}),
      mediaKind,
    },
    admin: mediaUploadAdmin(field.admin ?? {}),
  } as UploadField;
}

export function imageUploadAdmin(admin: UploadFieldAdmin = {}): UploadFieldAdmin {
  return mediaUploadAdmin(admin);
}

export function imageUploadField(field: Omit<UploadField, 'relationTo' | 'type'>): UploadField {
  return mediaUploadField(field, 'image');
}

export function videoUploadField(field: Omit<UploadField, 'relationTo' | 'type'>): UploadField {
  return mediaUploadField(field, 'video');
}
