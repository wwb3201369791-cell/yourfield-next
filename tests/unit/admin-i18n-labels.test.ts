import { readFileSync, readdirSync, statSync } from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { adminListLabel, adminTextDictionary } from '@/lib/payload/adminText';

const sourceRoots = ['src/collections', 'src/globals', 'src/lib/payload/fields'] as const;
const hanRegex = /[\u4e00-\u9fff]/;

function sourceFiles(root: string): string[] {
  const entries = readdirSync(root);

  return entries.flatMap((entry) => {
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return sourceFiles(fullPath);
    }

    return fullPath.endsWith('.ts') && !fullPath.includes(`${path.sep}__tests__${path.sep}`)
      ? [fullPath]
      : [];
  });
}

function protectedRequiredPathSpans(source: string) {
  const spans: Array<readonly [number, number]> = [];
  const requiredPathStart =
    /const\s+(?:\w*RequiredI18nPaths|requiredI18nPaths|contactRequiredI18nPaths)\s*=\s*\[/g;

  for (let match = requiredPathStart.exec(source); match; match = requiredPathStart.exec(source)) {
    const end = source.indexOf('] as const', match.index);

    if (end !== -1) {
      spans.push([match.index, end + '] as const'.length]);
    }
  }

  return spans;
}

function inSpans(index: number, spans: Array<readonly [number, number]>) {
  return spans.some(([start, end]) => index >= start && index < end);
}

describe('admin schema i18n labels', () => {
  it('has English dictionary entries for every adminLabel Chinese key', () => {
    const missing = sourceRoots
      .flatMap((root) => sourceFiles(root))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        const matches = Array.from(source.matchAll(/adminLabel\(\s*(['"])(.*?)\1/g));

        return matches
          .map((match) => match[2] ?? '')
          .filter((label) => hanRegex.test(label) && !adminTextDictionary[label])
          .map((label) => `${file}: ${label}`);
      });

    expect(missing).toEqual([]);
  });

  it('does not leave visible Payload schema labels or descriptions as raw Chinese strings', () => {
    const rawSchemaStrings = sourceRoots
      .flatMap((root) => sourceFiles(root))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        const protectedSpans = protectedRequiredPathSpans(source);
        const matches = Array.from(
          source.matchAll(
            /\b(label|description|group|placeholder|buttonLabel|singular|plural)\s*:\s*(['"])(.*?[\u4e00-\u9fff].*?)\2/g,
          ),
        );

        return matches
          .filter((match) => !inSpans(match.index ?? 0, protectedSpans))
          .map((match) => `${file}: ${match[1]}: ${match[3]}`);
      });

    expect(rawSchemaStrings).toEqual([]);
  });

  it('localizes collection row action labels used in admin lists', () => {
    expect(adminTextDictionary).toMatchObject({
      操作: 'Actions',
      编辑: 'Edit',
      上移: 'Move up',
      下移: 'Move down',
      调整中: 'Moving',
      调整顺序失败: 'Move failed',
      添加解决方案: 'Add solution',
      添加产品大类: 'Add product group',
      添加产品: 'Add product',
    });
  });

  it('keeps collection singular/plural labels as plain strings for Payload dashboard links', () => {
    const unsafeCollectionLabels = sourceFiles('src/collections').flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      const matches = Array.from(source.matchAll(/\b(singular|plural)\s*:\s*(adminLabel\(|\{)/g));

      return matches.map((match) => `${file}: ${match[1]} uses ${match[2]}`);
    });

    expect(unsafeCollectionLabels).toEqual([]);
  });

  it('keeps sortable list labels as plain strings to avoid Payload aria [object Object]', () => {
    expect(adminListLabel('方案标题')).toBe('方案标题');

    const sortableLabelsByCollection = {
      'src/collections/FormSubmissions.ts': [
        '咨询类型',
        '姓名',
        '邮箱',
        '电话',
        '处理状态',
        '公司',
        '国家 / 地区',
      ],
      'src/collections/Solutions.ts': ['方案标题', '前台位置', '发布时间'],
      'src/collections/Products.ts': ['型号 / 规格', '产品名称', '所属产品大类'],
    } as const;

    for (const [file, labels] of Object.entries(sortableLabelsByCollection)) {
      const source = readFileSync(file, 'utf8');

      for (const label of labels) {
        expect(source).toContain(`label: adminListLabel('${label}')`);
        expect(source).not.toContain(`label: adminLabel('${label}')`);
      }
    }
  });
});
