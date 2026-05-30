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
});
