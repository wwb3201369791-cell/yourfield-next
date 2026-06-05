import { readFileSync, readdirSync, statSync } from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { adminTextDictionary } from '@/lib/payload/adminText';

const sourceRoot = 'src/components/admin';
const hanRegex = /[\u4e00-\u9fff]/;

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return sourceFiles(fullPath);
    }

    return fullPath.endsWith('.tsx') && !fullPath.includes(`${path.sep}__tests__${path.sep}`)
      ? [fullPath]
      : [];
  });
}

function isInlineBilingualZhValue(source: string, quoteIndex: number) {
  const prefix = source.slice(Math.max(0, quoteIndex - 24), quoteIndex);

  return /\bzh\s*:\s*$/.test(prefix);
}

function visibleChineseStringLiterals(source: string) {
  return Array.from(source.matchAll(/(['"])([^'"\n]*[\u4e00-\u9fff][^'"\n]*)\1/g))
    .filter((match) => !isInlineBilingualZhValue(source, match.index ?? 0))
    .map((match) => ({
      index: match.index ?? 0,
      value: match[2] ?? '',
    }))
    .filter((match) => hanRegex.test(match.value));
}

describe('admin component i18n dictionary coverage', () => {
  it('covers visible Chinese copy used by custom admin components', () => {
    const missing = sourceFiles(sourceRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8');

      return visibleChineseStringLiterals(source)
        .filter(({ value }) => !adminTextDictionary[value])
        .map(
          ({ index, value }) => `${file}:${source.slice(0, index).split('\n').length}: ${value}`,
        );
    });

    expect(missing).toEqual([]);
  });
});
