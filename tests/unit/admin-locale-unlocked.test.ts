import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

describe('Payload admin locale editing', () => {
  it('does not ship the old locale guard component', () => {
    expect(existsSync(path.join(projectRoot, 'src/components/admin/AdminLocaleGuard.tsx'))).toBe(
      false,
    );
  });

  it('hides the Payload locale switcher from the simplified admin header', () => {
    const css = readFileSync(path.join(projectRoot, 'src/styles/payload-admin.css'), 'utf8');

    expect(css).toContain('.app-header__localizer');
    expect(css).toContain('.app-header__localizer-spacing');
  });
});
