import { describe, expect, it } from 'vitest';

import { productEditorPreviewLabel } from '@/components/admin/product-editor/productEditorPreviewLabels';

describe('product editor preview labels', () => {
  it('uses the edited content locale instead of hard-coded Chinese preview chrome', () => {
    expect(productEditorPreviewLabel('en', 'page.products.title')).toBe('Products Center');
    expect(productEditorPreviewLabel('en', 'product.detail.navTitle')).toBe('Detail sections');
    expect(productEditorPreviewLabel('en', 'product.detail.sizeGuide')).toBe('Size Guide');
    expect(productEditorPreviewLabel('ru', 'page.products.title')).toBe('Центр продукции');
    expect(productEditorPreviewLabel('ru', 'product.detail.navTitle')).toBe('Разделы');
  });

  it('falls back to Chinese or the key only when a message is genuinely missing', () => {
    expect(productEditorPreviewLabel('zh', 'product.detail.navTitle')).toBe('详情目录');
    expect(productEditorPreviewLabel('en', 'missing.key')).toBe('missing.key');
  });
});
