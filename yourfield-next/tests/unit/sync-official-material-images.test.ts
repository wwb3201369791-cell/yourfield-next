import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseOfficialMaterialFolder } from '../../scripts/seed/import-official-materials';
import { buildOfficialImageUpdateData } from '../../scripts/seed/sync-official-material-images';

const materialsRoot = path.resolve(process.cwd(), '官网资料');

describe('official material image sync helpers', () => {
  it('uses the first official image as the main image and every official image in the gallery', () => {
    const material = parseOfficialMaterialFolder(path.join(materialsRoot, '4级防电弧服(夹克款)'));
    const updateData = buildOfficialImageUpdateData(material, [101, 102, 103, 104, 105]);

    expect(updateData.images).toEqual([{ file: 101 }]);
    expect(updateData.visualGroups).toEqual([
      {
        variant: 'gallery',
        title: '产品图册',
        description: '展示产品图片、细节与穿着效果。',
        images: [{ file: 101 }, { file: 102 }, { file: 103 }, { file: 104 }, { file: 105 }],
      },
    ]);
  });
});
