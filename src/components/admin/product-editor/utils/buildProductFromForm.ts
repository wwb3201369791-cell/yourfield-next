'use client';

import { useFormFields } from '@payloadcms/ui';
import { reduceFieldsToValues } from 'payload/shared';
import { useMemo } from 'react';

import {
  buildProductFromFormValues,
  buildSectionPropsFromFormValues,
  type ProductDetailTranslator,
} from '@/lib/content/buildSectionProps';
import type { Locale } from '@/lib/i18n/locale';

export function useFormValues() {
  const fields = useFormFields(([formFields]) => formFields);

  return useMemo(
    () => reduceFieldsToValues(fields, true, true) as Record<string, unknown>,
    [fields],
  );
}

export function useFormProduct(_locale: Locale = 'zh') {
  const values = useFormValues();

  return useMemo(() => buildProductFromFormValues(values, _locale), [_locale, values]);
}

export function useSectionPropsFromForm(locale: Locale, t: ProductDetailTranslator) {
  const values = useFormValues();

  return useMemo(() => buildSectionPropsFromFormValues(values, locale, t), [locale, t, values]);
}
