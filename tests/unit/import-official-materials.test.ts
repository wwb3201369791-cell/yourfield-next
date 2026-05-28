import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildProductUpdateData,
  discoverOfficialMaterials,
  parseOfficialMaterialFolder,
} from '../../scripts/seed/import-official-materials';

const materialsRoot = path.resolve(process.cwd(), '官网资料');

describe('official material importer helpers', () => {
  it('discovers all folders and marks firefighter combat suit as skipped', () => {
    const materials = discoverOfficialMaterials(materialsRoot);
    const skipped = materials.filter((item) => item.skip);

    expect(materials).toHaveLength(30);
    expect(skipped.map((item) => item.dirName)).toEqual(['消防员灭火防护服(作战款)']);
    expect(materials.filter((item) => !item.skip)).toHaveLength(29);
  });

  it('parses product instructions into structured fields', () => {
    const material = parseOfficialMaterialFolder(
      path.join(materialsRoot, '消防员灭火防护服(指挥款)'),
    );

    expect(material.name).toBe('消防员灭火防护服(指挥款)');
    expect(material.model).toBe('HYF-5511');
    expect(material.color).toBe('藏青');
    expect(material.standards).toEqual(['XF10-2014消防员灭火防护服']);
    expect(material.materials).toEqual([
      '外层：双丝登工增强型面料',
      '防水透气隔热层：芳纶无纺布 ＋阻燃PTFE膜',
      '舒适层：芳纶、粘胶阻燃布',
    ]);
    expect(material.applications).toEqual([
      '适用于消防员在灭火战斗中有烧伤或灼伤的场合穿着，不适用于在化学、生物、辐射和电气等特殊环境中穿着（如核设施、海上平台、矿井地下火灾等）。',
    ]);
    expect(material.imagePaths.map((imagePath) => path.basename(imagePath))).toEqual([
      '1.png',
      '2.png',
      '3.png',
      '4.png',
      '5.png',
    ]);
  });

  it('maps image 1 to product main images and later images to modeling visual group', () => {
    const material = parseOfficialMaterialFolder(
      path.join(materialsRoot, '消防员灭火防护服(指挥款)'),
    );
    const updateData = buildProductUpdateData(material, [101, 102, 103, 104, 105]);

    expect(updateData.images).toEqual([{ file: 101 }]);
    expect(updateData.visualGroups).toEqual([
      {
        variant: 'detail',
        title: '建模图',
        description: '展示产品细节、结构与穿着效果。',
        images: [{ file: 102 }, { file: 103 }, { file: 104 }, { file: 105 }],
      },
    ]);
    expect(updateData.model).toBe('HYF-5511');
    expect(updateData.sku).toBe('HYF-5511');
  });
});
