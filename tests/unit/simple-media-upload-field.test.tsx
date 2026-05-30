// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SimpleMediaUploadField from '@/components/admin/media-upload/SimpleMediaUploadField';

const fieldState = vi.hoisted(() => ({
  setValue: vi.fn(),
  validateUpload: vi.fn(
    (_value: unknown, options: { req?: { payload?: { collections?: unknown } } }) => {
      if (!options.req?.payload?.collections) {
        throw new Error('Payload upload validator requires collection metadata');
      }

      return true;
    },
  ),
}));

vi.mock('@payloadcms/ui', () => ({
  useConfig: () => ({
    config: {
      routes: {
        api: '/payload-api',
      },
      serverURL: '',
    },
  }),
  useField: (options: { validate?: (value: unknown, options: unknown) => unknown } = {}) => {
    options.validate?.(1, {
      event: 'onChange',
      req: {
        payload: {},
        t: (key: string) => key,
      },
    });

    options.validate?.(1, {
      event: 'onChange',
      req: {
        payload: {
          collections: {
            media: { customIDType: 'number' },
          },
          db: { defaultIDType: 'number' },
        },
        t: (key: string) => key,
      },
    });

    return {
      errorMessage: '',
      setValue: fieldState.setValue,
      showError: false,
      value: null,
    };
  },
  useLocale: () => ({ code: 'zh' }),
  useTranslation: () => ({
    i18n: { language: 'zh' },
  }),
}));

vi.mock('payload/shared', () => ({
  upload: fieldState.validateUpload,
}));

afterEach(() => {
  cleanup();
  fieldState.setValue.mockClear();
  fieldState.validateUpload.mockClear();
});

function renderUploadField(fieldOverrides: Record<string, unknown> = {}) {
  return render(
    <SimpleMediaUploadField
      field={
        {
          admin: {
            description: '前台解决方案卡片使用的主图。',
          },
          custom: {
            mediaKind: 'image',
          },
          label: '方案主图',
          name: 'cover',
          relationTo: 'media',
          required: false,
          ...fieldOverrides,
        } as never
      }
      path="cover"
    />,
  );
}

describe('SimpleMediaUploadField', () => {
  it('reads labels and descriptions from the Payload field config prop', () => {
    renderUploadField();

    expect(screen.getByText('方案主图')).toBeTruthy();
    expect(screen.getByText('前台解决方案卡片使用的主图。')).toBeTruthy();
    expect(screen.getByRole('button', { name: '选择图片' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '从本地选择一张图片' })).toBeTruthy();
    expect(fieldState.validateUpload).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ relationTo: 'media', required: false }),
    );
  });

  it('does not crash when Payload omits optional label/name metadata', () => {
    expect(() => renderUploadField({ label: undefined, name: undefined })).not.toThrow();

    expect(screen.getByText('cover')).toBeTruthy();
  });
});
