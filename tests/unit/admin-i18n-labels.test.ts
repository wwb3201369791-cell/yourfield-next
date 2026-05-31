import { readFileSync, readdirSync, statSync } from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { adminTextDictionary } from '@/lib/payload/adminText';

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
});
