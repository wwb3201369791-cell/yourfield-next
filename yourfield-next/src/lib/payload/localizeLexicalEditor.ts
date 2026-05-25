import {
  SlashMenuOption,
  type Feature,
  type FeatureProvider,
  type FloatingToolbarSection,
  type FloatingToolbarSectionEntry,
  type SlashMenuGroup,
} from '@payloadcms/richtext-lexical';

const floatingSelectToolbarLabelsByKey: Record<string, string> = {
  blockquote: '引用',
  checkList: '待办清单',
  h1: '一级标题',
  h2: '二级标题',
  h3: '三级标题',
  h4: '四级标题',
  h5: '五级标题',
  h6: '六级标题',
  'normal-text': '正文',
  orderedList: '有序列表',
  unorderedList: '无序列表',
};

const slashMenuLabelsByDisplayName: Record<string, string> = {
  Basic: '基础',
  Blocks: '内容区块',
  Blockquote: '引用',
  'Check List': '待办清单',
  'Heading 1': '一级标题',
  'Heading 2': '二级标题',
  'Heading 3': '三级标题',
  'Heading 4': '四级标题',
  'Heading 5': '五级标题',
  'Heading 6': '六级标题',
  'Horizontal Rule': '分隔线',
  Lists: '列表',
  'Ordered List': '有序列表',
  Paragraph: '正文',
  Relationship: '关联内容',
  'Unordered List': '无序列表',
  Upload: '上传文件',
};

export function localizeLexicalFeatures(defaultFeatures: FeatureProvider[]): FeatureProvider[] {
  return defaultFeatures.map(localizeLexicalFeatureProvider);
}

function localizeLexicalFeatureProvider(provider: FeatureProvider): FeatureProvider {
  return {
    ...provider,
    feature: (props) => localizeLexicalFeature(provider.feature(props)),
  };
}

function localizeLexicalFeature(feature: Feature): Feature {
  const localizedFeature: Feature = { ...feature };

  if (feature.floatingSelectToolbar) {
    localizedFeature.floatingSelectToolbar = {
      sections: feature.floatingSelectToolbar.sections.map(localizeFloatingToolbarSection),
    };
  }

  if (feature.slashMenu) {
    localizedFeature.slashMenu = localizeSlashMenu(feature.slashMenu);
  }

  return localizedFeature;
}

function localizeFloatingToolbarSection(section: FloatingToolbarSection): FloatingToolbarSection {
  if (section.type === 'dropdown') {
    return {
      ...section,
      entries: section.entries.map(localizeFloatingToolbarEntry),
    };
  }

  return {
    ...section,
    entries: section.entries.map(localizeFloatingToolbarEntry),
  };
}

function localizeFloatingToolbarEntry(
  entry: FloatingToolbarSectionEntry,
): FloatingToolbarSectionEntry {
  const label = floatingSelectToolbarLabelsByKey[entry.key];

  if (!label) {
    return entry;
  }

  return {
    ...entry,
    label,
  };
}

function localizeSlashMenu(
  slashMenu: NonNullable<Feature['slashMenu']>,
): NonNullable<Feature['slashMenu']> {
  const localizedSlashMenu: NonNullable<Feature['slashMenu']> = { ...slashMenu };

  if (slashMenu.options) {
    localizedSlashMenu.options = slashMenu.options.map(localizeSlashMenuGroup);
  }

  if (slashMenu.dynamicOptions) {
    localizedSlashMenu.dynamicOptions = (args) =>
      slashMenu.dynamicOptions?.(args).map(localizeSlashMenuGroup) ?? [];
  }

  return localizedSlashMenu;
}

function localizeSlashMenuGroup(group: SlashMenuGroup): SlashMenuGroup {
  const displayName = localizeSlashMenuDisplayName(group.displayName);
  const localizedGroup: SlashMenuGroup = {
    key: group.key,
    options: group.options.map(localizeSlashMenuOption),
  };

  if (displayName) {
    localizedGroup.displayName = displayName;
  }

  return localizedGroup;
}

function localizeSlashMenuOption(option: SlashMenuOption): SlashMenuOption {
  const displayName = localizeSlashMenuDisplayName(option.displayName);

  if (displayName === option.displayName) {
    return option;
  }

  const options: ConstructorParameters<typeof SlashMenuOption>[1] = {
    Icon: option.Icon,
    keywords: option.keywords,
    onSelect: option.onSelect,
  };

  if (displayName) {
    options.displayName = displayName;
  }

  if (option.keyboardShortcut) {
    options.keyboardShortcut = option.keyboardShortcut;
  }

  return new SlashMenuOption(option.key, options);
}

function localizeSlashMenuDisplayName(
  displayName: SlashMenuGroup['displayName'],
): SlashMenuGroup['displayName'] {
  if (typeof displayName !== 'string') {
    return displayName;
  }

  return slashMenuLabelsByDisplayName[displayName] ?? displayName;
}
