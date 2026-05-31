import type { ProductDetailSectionProps } from '@/lib/content/buildSectionProps';

import type { EditorSection } from '../hooks/useEditorContext';
import { productEditorDetailSections } from '../productEditorSections';

export type ProductEditorSectionStatus = 'complete' | 'hidden' | 'missing';
type ProductEditorFormValues = Record<string, unknown> | undefined;

const sectionContentKey: Partial<Record<EditorSection, keyof ProductDetailSectionProps>> = {
  care: 'care',
  evidence: 'qualityEvidence',
  faq: 'faq',
  intro: 'intro',
  scenarios: 'scenarios',
  'selling-points': 'sellingPoints',
  'size-guide': 'sizeGuide',
  specifications: 'specifications',
  'visual-groups': 'visualGroups',
};

const coreDetailSections = new Set<EditorSection>([
  'intro',
  'selling-points',
  'specifications',
  'scenarios',
]);

function imageRowHasValue(row: unknown) {
  if (typeof row === 'string') {
    return row.trim().length > 0;
  }

  if (typeof row === 'number') {
    return Number.isFinite(row);
  }

  if (!row || typeof row !== 'object') {
    return false;
  }

  const record = row as Record<string, unknown>;
  const file = record.file;

  if (typeof file === 'string') {
    return file.trim().length > 0;
  }

  if (typeof file === 'number') {
    return Number.isFinite(file);
  }

  return Boolean(file && typeof file === 'object');
}

function formValuesHaveVisualGroupImages(values: ProductEditorFormValues) {
  const visualGroups = values?.visualGroups;

  if (!Array.isArray(visualGroups)) {
    return false;
  }

  return visualGroups.some((group) => {
    if (!group || typeof group !== 'object') {
      return false;
    }

    const images = (group as Record<string, unknown>).images;
    return Array.isArray(images) && images.some(imageRowHasValue);
  });
}

export function productEditorSectionStatus(
  section: EditorSection,
  sections: ProductDetailSectionProps,
  formValues?: ProductEditorFormValues,
): ProductEditorSectionStatus {
  const contentKey = sectionContentKey[section];

  if (!contentKey) {
    return 'hidden';
  }

  if (section === 'visual-groups') {
    return formValuesHaveVisualGroupImages(formValues) ? 'complete' : 'hidden';
  }

  if (sections[contentKey]) {
    return 'complete';
  }

  return coreDetailSections.has(section) ? 'missing' : 'hidden';
}

export function buildProductEditorSectionStatuses(
  sections: ProductDetailSectionProps,
  formValues?: ProductEditorFormValues,
) {
  return productEditorDetailSections.map((item) => ({
    ...item,
    status: productEditorSectionStatus(item.section, sections, formValues),
  }));
}

export function summarizeProductEditorSections(
  sections: ProductDetailSectionProps,
  formValues?: ProductEditorFormValues,
) {
  const items = buildProductEditorSectionStatuses(sections, formValues);

  return {
    complete: items.filter((item) => item.status === 'complete').length,
    coreMissing: items.filter((item) => item.status === 'missing').length,
    total: items.length,
  };
}
