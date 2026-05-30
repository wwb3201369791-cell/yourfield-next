import type { Locale } from '@/lib/i18n/locale';

export type LocalizedText = Readonly<Record<Locale, string>>;

export type ProductGroupId = string;

export type ProductSpec = Readonly<{
  label: LocalizedText;
  value: LocalizedText | string;
}>;

export type ProductFaq = Readonly<{
  question: LocalizedText;
  answer: LocalizedText;
}>;

export type ProductVisualGroup = Readonly<{
  description: LocalizedText;
  images: readonly string[];
  title: LocalizedText;
  variant: string;
}>;

export type ProductDetailCard = Readonly<{
  title: LocalizedText;
  text: LocalizedText;
}>;

export type ProductQualityEvidence = Readonly<{
  description: LocalizedText;
  status: LocalizedText;
  title: LocalizedText;
  type?: string;
}>;

export type ProductSizeGuide = Readonly<{
  columns: readonly string[];
  rows: readonly ProductSizeGuideRow[];
  cornerLabel?: LocalizedText;
  title?: LocalizedText;
}>;

export type ProductSizeGuideRow = Readonly<{
  label: string;
  values: readonly string[];
}>;

export type Product = Readonly<{
  id: string;
  model: string;
  sku?: string;
  categoryId: string;
  categoryName: LocalizedText;
  groupId: ProductGroupId;
  name: LocalizedText;
  description: LocalizedText;
  image: string;
  images: readonly string[];
  standards: readonly string[];
  materials: readonly LocalizedText[];
  sizeRange?: readonly string[];
  applications: readonly LocalizedText[];
  features: readonly LocalizedText[];
  specifications: readonly ProductSpec[];
  faqs: readonly ProductFaq[];
  careInstructions?: readonly LocalizedText[];
  qualityEvidence?: readonly ProductQualityEvidence[];
  scenarios?: readonly ProductDetailCard[];
  sellingPoints?: readonly ProductDetailCard[];
  sizeGuide?: ProductSizeGuide;
  visualGroups?: readonly ProductVisualGroup[];
  previewInherited?: boolean;
}>;

export function localized(value: LocalizedText, locale: Locale) {
  return value[locale] || value.zh;
}

export function specValue(value: LocalizedText | string, locale: Locale) {
  return typeof value === 'string' ? value : localized(value, locale);
}
