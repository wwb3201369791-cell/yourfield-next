import { describe, expect, it } from 'vitest';

import type { ProductDetailSectionProps } from '@/lib/content/buildSectionProps';

import { productEditorSectionStatus } from '../utils/productEditorCompletion';

const emptySections = {
  care: null,
  faq: null,
  hero: {} as ProductDetailSectionProps['hero'],
  intro: null,
  qualityEvidence: null,
  scenarios: null,
  sellingPoints: null,
  sidebar: null,
  sizeGuide: null,
  specifications: null,
  visualGroups: null,
} satisfies ProductDetailSectionProps;

describe('ProductEditorSidebar', () => {
  it('marks core storefront sections as missing when they have no visible content', () => {
    expect(productEditorSectionStatus('intro', emptySections)).toBe('missing');
    expect(productEditorSectionStatus('selling-points', emptySections)).toBe('missing');
    expect(productEditorSectionStatus('specifications', emptySections)).toBe('missing');
    expect(productEditorSectionStatus('scenarios', emptySections)).toBe('missing');
  });

  it('marks optional sections as hidden when they will not render on the storefront', () => {
    expect(productEditorSectionStatus('size-guide', emptySections)).toBe('hidden');
    expect(productEditorSectionStatus('visual-groups', emptySections)).toBe('hidden');
    expect(productEditorSectionStatus('evidence', emptySections)).toBe('hidden');
    expect(productEditorSectionStatus('care', emptySections)).toBe('hidden');
    expect(productEditorSectionStatus('faq', emptySections)).toBe('hidden');
  });

  it('marks a section complete once its storefront section props exist', () => {
    const sections = {
      ...emptySections,
      specifications: {
        heading: '参数规格',
        locale: 'zh',
        rows: [{ label: '型号', value: 'YF-001' }],
        tagLabel: '参数',
      },
    } satisfies ProductDetailSectionProps;

    expect(productEditorSectionStatus('specifications', sections)).toBe('complete');
  });

  it('marks visual groups complete when uploaded images are still media ids in form state', () => {
    expect(
      productEditorSectionStatus('visual-groups', emptySections, {
        visualGroups: [
          {
            images: [{ file: 42 }],
            title: '场景图',
            variant: 'scene',
          },
        ],
      }),
    ).toBe('complete');
  });
});
