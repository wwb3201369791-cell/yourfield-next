import { adminUiText, type AdminInterfaceLocale } from '@/lib/payload/adminText';

const navTextOverrides: Readonly<Record<string, string>> = {
  产品: 'Products',
  产品大类: 'Product Groups',
  产品管理: 'Product Management',
  全局设置: 'Global Settings',
  内容管理: 'Content Management',
  新闻动态: 'News',
  解决方案: 'Solutions',
  联系方式: 'Contact Info',
  咨询表单: 'Inquiry Forms',
};

const adminNavSourceLabels = Object.keys(
  navTextOverrides,
) as readonly (keyof typeof navTextOverrides)[];

const localizedAdminNavTexts: Readonly<
  Record<AdminInterfaceLocale, Readonly<Record<string, string>>>
> = {
  en: adminNavSourceLabels.reduce<Record<string, string>>((acc, label) => {
    const english = navTextOverrides[label] ?? adminUiText('en', label);
    acc[label] = english;
    acc[english] = english;
    return acc;
  }, {}),
  zh: adminNavSourceLabels.reduce<Record<string, string>>((acc, label) => {
    const english = navTextOverrides[label] ?? adminUiText('en', label);
    acc[label] = label;
    acc[english] = label;
    return acc;
  }, {}),
};

export function localizeAdminNavText(value: string, locale: AdminInterfaceLocale) {
  const trimmed = value.trim();
  const replacement = localizedAdminNavTexts[locale][trimmed];

  if (!replacement || replacement === trimmed) {
    return value;
  }

  return value.replace(trimmed, replacement);
}
