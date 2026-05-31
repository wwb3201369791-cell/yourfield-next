import { readFileSync } from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

describe('Payload admin layout CSS', () => {
  it('loads Payload base admin CSS before project admin overrides', () => {
    const layoutSource = readFileSync(
      path.join(projectRoot, 'src/app/(payload)/layout.tsx'),
      'utf8',
    );
    const baseCssImport = "import '@payloadcms/next/css';";
    const overrideCssImport = "import '@/styles/payload-admin.css';";

    expect(layoutSource).toContain(baseCssImport);
    expect(layoutSource).toContain(overrideCssImport);
    expect(layoutSource.indexOf(baseCssImport)).toBeLessThan(
      layoutSource.indexOf(overrideCssImport),
    );
  });

  it('hides technical document tabs from simplified edit pages', () => {
    const css = readFileSync(path.join(projectRoot, 'src/styles/payload-admin.css'), 'utf8');

    expect(css).toContain('.collection-edit .doc-tabs');
    expect(css).toContain('.global-edit .doc-tabs');
    expect(css).toContain('.template-default .doc-header .doc-tabs');
    expect(css).toContain(".doc-tab__link[href$='/api']");
    expect(css).toContain(".doc-tab__link[href*='/versions']");
  });
});
