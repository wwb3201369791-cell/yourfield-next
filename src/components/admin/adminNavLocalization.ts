import { adminUiText, type AdminInterfaceLocale } from '@/lib/payload/adminText';

const adminChromeTextOverrides: Readonly<Record<string, string>> = {
  媒体文件: 'Media files',
  产品: 'Products',
  产品大类: 'Product Groups',
  产品分类: 'Product categories',
  产品管理: 'Product Management',
  全局设置: 'Global Settings',
  内容管理: 'Content Management',
  后台用户: 'Admin users',
  新闻动态: 'News',
  搜索日志: 'Search logs',
  审计日志: 'Audit logs',
  解决方案: 'Solutions',
  联系方式: 'Contact Info',
  咨询表单: 'Inquiry Forms',
  常见问题: 'FAQ',
  页面: 'Pages',
  系统设置: 'System settings',
  仪表板: 'Dashboard',
  永霏网站后台: 'YourField Admin',
};

const adminChromeSourceLabels = Object.keys(
  adminChromeTextOverrides,
) as readonly (keyof typeof adminChromeTextOverrides)[];

const localizedAdminChromeTexts: Readonly<
  Record<AdminInterfaceLocale, Readonly<Record<string, string>>>
> = {
  en: adminChromeSourceLabels.reduce<Record<string, string>>((acc, label) => {
    const english = adminChromeTextOverrides[label] ?? adminUiText('en', label);
    acc[label] = english;
    acc[english] = english;
    return acc;
  }, {}),
  zh: adminChromeSourceLabels.reduce<Record<string, string>>((acc, label) => {
    const english = adminChromeTextOverrides[label] ?? adminUiText('en', label);
    acc[label] = label;
    acc[english] = label;
    return acc;
  }, {}),
};

const preservedTextSelector = [
  '[data-yf-preserve-admin-text]',
  '[contenteditable="true"]',
  'input',
  'option',
  'script',
  'select',
  'style',
  'textarea',
].join(',');

export function localizeAdminNavText(value: string, locale: AdminInterfaceLocale) {
  const trimmed = value.trim();
  const replacement = localizedAdminChromeTexts[locale][trimmed];

  if (!replacement || replacement === trimmed) {
    return value;
  }

  return value.replace(trimmed, replacement);
}

export function localizeAdminDocumentTitle(value: string, locale: AdminInterfaceLocale) {
  return value
    .split(' - ')
    .map((part) => localizeAdminNavText(part, locale))
    .join(' - ');
}

function nodeElement(node: Node) {
  if (node instanceof Element) {
    return node;
  }

  return node.parentElement;
}

function shouldPreserveText(node: Node) {
  return Boolean(nodeElement(node)?.closest(preservedTextSelector));
}

function localizeElementAttributes(element: Element, locale: AdminInterfaceLocale) {
  if (shouldPreserveText(element)) {
    return;
  }

  for (const attributeName of ['aria-label', 'placeholder', 'title']) {
    const attributeValue = element.getAttribute(attributeName);

    if (!attributeValue) {
      continue;
    }

    const localizedValue = localizeAdminNavText(attributeValue, locale);

    if (localizedValue !== attributeValue) {
      element.setAttribute(attributeName, localizedValue);
    }
  }
}

export function localizeAdminChromeRoot(root: ParentNode, locale: AdminInterfaceLocale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    if (shouldPreserveText(node)) {
      continue;
    }

    const localizedValue = localizeAdminNavText(node.nodeValue ?? '', locale);

    if (localizedValue !== node.nodeValue) {
      node.nodeValue = localizedValue;
    }
  }

  if (root instanceof Element) {
    localizeElementAttributes(root, locale);
  }

  for (const element of Array.from(root.querySelectorAll('*'))) {
    localizeElementAttributes(element, locale);
  }
}
