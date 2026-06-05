import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { FormSubmissions } from '@/collections/FormSubmissions';
import { News } from '@/collections/News';
import { ProductGroups } from '@/collections/ProductGroups';
import { Products } from '@/collections/Products';
import { Solutions } from '@/collections/Solutions';
import { SiteSettings } from '@/globals/SiteSettings';
import {
  productContentLocales,
  requiredProductI18nPaths,
} from '@/lib/product/productI18nRequirements';

type NamedField = Field & { name?: string };

function flattenFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => flattenFields(tab.fields));
    }

    if (field.type === 'collapsible') {
      return flattenFields(field.fields);
    }

    return [field];
  });
}

function fieldByPath(fields: readonly Field[], path: readonly string[]): Field | undefined {
  let currentFields = flattenFields(fields);
  let found: Field | undefined;

  for (const segment of path) {
    found = currentFields.find((field) => 'name' in field && field.name === segment);
    if (!found) return undefined;
    currentFields = 'fields' in found ? found.fields : [];
  }

  return found;
}

function namedField(config: CollectionConfig | GlobalConfig, name: string) {
  return flattenFields(config.fields).find(
    (field): field is NamedField => 'name' in field && field.name === name,
  );
}

function collectionHasCrudAccess(collection: CollectionConfig) {
  expect(collection.access?.create).toBeTypeOf('function');
  expect(collection.access?.read).toBeTypeOf('function');
  expect(collection.access?.update).toBeTypeOf('function');
  expect(collection.access?.delete).toBeTypeOf('function');
}

describe('admin business CRUD contracts', () => {
  it('keeps inquiry form admin as customer-created records with read/update/delete follow-up workflow', () => {
    expect(FormSubmissions.admin?.defaultColumns).toEqual([
      'inquiryType',
      'name',
      'email',
      'phone',
      'status',
      'createdAt',
      'company',
      'country',
    ]);
    expect(FormSubmissions.access?.read).toBeTypeOf('function');
    expect(FormSubmissions.access?.update).toBeTypeOf('function');
    expect(FormSubmissions.access?.delete).toBeTypeOf('function');
    expect(FormSubmissions.access?.create?.({ req: {} } as never)).toBe(false);
    expect(namedField(FormSubmissions, 'status')).toMatchObject({ required: true, type: 'select' });
    expect(namedField(FormSubmissions, 'notes')).toMatchObject({ type: 'array' });
    expect(FormSubmissions.hooks?.afterChange).toHaveLength(2);
    expect(FormSubmissions.hooks?.afterDelete).toHaveLength(1);
  });

  it('keeps solutions, news, product groups, and products editable through full CRUD admin workflows', () => {
    for (const collection of [Solutions, News, ProductGroups, Products]) {
      collectionHasCrudAccess(collection);
      expect(collection.admin?.hideAPIURL).toBe(true);
      expect(collection.hooks?.afterChange?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(collection.hooks?.afterDelete?.length ?? 0).toBeGreaterThanOrEqual(1);
    }

    expect(Solutions.admin?.defaultColumns).toContain('rowActions');
    expect(News.admin?.defaultColumns).toContain('rowActions');
    expect(ProductGroups.admin?.defaultColumns).toContain('rowActions');
    expect(Products.admin?.defaultColumns).toContain('rowActions');
    expect(ProductGroups.admin?.defaultColumns).toContain('showOnFrontendBadge');
    expect(Products.admin?.components?.views?.edit?.default).toMatchObject({
      Component: '@/components/admin/product-editor/ProductVisualEditor',
    });
  });

  it('keeps contact information editable from Site Settings with localized address validation', () => {
    expect(SiteSettings.access?.read).toBeTypeOf('function');
    expect(SiteSettings.access?.update).toBeTypeOf('function');
    expect(fieldByPath(SiteSettings.fields, ['contact', 'phone'])).toMatchObject({ type: 'text' });
    expect(fieldByPath(SiteSettings.fields, ['contact', 'email'])).toMatchObject({ type: 'email' });
    expect(fieldByPath(SiteSettings.fields, ['contact', 'address'])).toMatchObject({
      localized: true,
      type: 'textarea',
    });
    expect(SiteSettings.hooks?.beforeChange).toHaveLength(1);
    expect(SiteSettings.hooks?.afterChange).toHaveLength(2);
  });

  it('keeps product three-language editing requirements centralized for zh/en/ru', () => {
    expect(productContentLocales).toEqual(['zh', 'en', 'ru']);
    expect(requiredProductI18nPaths.map((item) => item.path)).toEqual([
      'name',
      'description',
      'materials',
      'materials.value',
      'features',
      'features.title',
      'features.description',
      'sellingPoints',
      'sellingPoints.title',
      'sellingPoints.text',
      'specifications',
      'specifications.label',
      'specifications.value',
      'applications',
      'applications.value',
      'scenarios',
      'scenarios.title',
      'scenarios.description',
      'visualGroups',
      'visualGroups.title',
      'visualGroups.description',
      'careInstructions',
      'careInstructions.value',
      'qualityEvidence',
      'qualityEvidence.title',
      'qualityEvidence.description',
    ]);
  });
});
