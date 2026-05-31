import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

function readProjectFile(filePath: string) {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('product detail layout CSS', () => {
  it('lets the public hero card shrink inside the sidebar layout without horizontal overflow', () => {
    const css = readProjectFile('src/styles/legacy-product-detail.css');

    expect(css).toContain('grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);');
    expect(css).not.toContain(
      'grid-template-columns: minmax(340px, 0.88fr) minmax(480px, 1.12fr);',
    );
  });

  it('uses contain-fit product images in the admin visual editor preview', () => {
    const css = readProjectFile('src/styles/admin-product-editor.css');
    const imageRule =
      css.match(/\.ype-detail-preview \.detail-main-image img \{[^}]+\}/)?.[0] ?? '';

    expect(css).toContain('.ype-detail-preview .detail-hero-card');
    expect(css).toContain('grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);');
    expect(imageRule).toContain('object-fit: contain;');
    expect(imageRule).toContain('padding: 18px;');
  });
});
