import {
  BlockQuoteFeature,
  CheckListFeature,
  HeadingFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  type EditorConfig,
  type Feature,
  type FeatureProvider,
  type ResolvedFeatureMap,
} from '@payloadcms/richtext-lexical';
import { describe, expect, it } from 'vitest';

import { localizeLexicalFeatures } from '@/lib/payload/localizeLexicalEditor';

function resolveFeature(provider: FeatureProvider, providers: FeatureProvider[]): Feature {
  return provider.feature({
    featureProviderMap: new Map(
      providers.map((featureProvider) => [featureProvider.key, featureProvider]),
    ),
    resolvedFeatures: new Map() as ResolvedFeatureMap,
    unsanitizedEditorConfig: { features: providers } satisfies EditorConfig,
  });
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function collectFloatingSelectLabels(providers: FeatureProvider[]): string[] {
  return providers.flatMap((provider) => {
    const feature = resolveFeature(provider, providers);

    return (
      feature.floatingSelectToolbar?.sections.flatMap((section) =>
        section.entries.map((entry) => entry.label).filter(isString),
      ) ?? []
    );
  });
}

function collectSlashMenuLabels(providers: FeatureProvider[]): string[] {
  return providers.flatMap((provider) => {
    const feature = resolveFeature(provider, providers);

    return (
      feature.slashMenu?.options?.flatMap((group) => [
        ...(isString(group.displayName) ? [group.displayName] : []),
        ...group.options.map((option) => option.displayName).filter(isString),
      ]) ?? []
    );
  });
}

describe('Lexical editor localization', () => {
  it('uses Chinese labels for the rich text style dropdown and slash menu', () => {
    const providers = localizeLexicalFeatures([
      ParagraphFeature(),
      HeadingFeature({}),
      OrderedListFeature(),
      UnorderedListFeature(),
      CheckListFeature(),
      BlockQuoteFeature(),
    ]);

    expect(collectFloatingSelectLabels(providers)).toEqual(
      expect.arrayContaining([
        '正文',
        '一级标题',
        '二级标题',
        '三级标题',
        '四级标题',
        '五级标题',
        '六级标题',
        '有序列表',
        '无序列表',
        '待办清单',
        '引用',
      ]),
    );
    expect(collectFloatingSelectLabels(providers)).not.toEqual(
      expect.arrayContaining([
        'Normal Text',
        'Heading 1',
        'Ordered List',
        'Unordered List',
        'Check List',
        'Blockquote',
      ]),
    );

    expect(collectSlashMenuLabels(providers)).toEqual(
      expect.arrayContaining([
        '基础',
        '列表',
        '正文',
        '一级标题',
        '有序列表',
        '无序列表',
        '待办清单',
        '引用',
      ]),
    );
  });
});
