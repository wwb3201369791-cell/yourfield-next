import type { Locale } from '@/lib/i18n/locale';
import { localized, specValue, type Product } from '@/lib/product/types';

type ProductDetailFactKey =
  | 'category'
  | 'color'
  | 'materials'
  | 'model'
  | 'sizeRange'
  | 'standard'
  | 'structure';

export type ProductDetailFactLabels = Readonly<Record<ProductDetailFactKey, string>>;

export type ProductDetailFact = Readonly<{
  label: string;
  value: string;
}>;

export type ProductDetailSpecification = Readonly<{
  label: string;
  value: string;
}>;

const factLabelAliases: Record<ProductDetailFactKey, readonly string[]> = {
  category: ['类别', '分类', 'Category', 'Категория'],
  color: ['颜色', 'Color', 'Цвет'],
  materials: ['材料', '材质', 'Materials', 'Материалы'],
  model: ['型号', '货号', '款号', '规格', 'Model', 'Модель'],
  sizeRange: ['尺码', '尺寸', 'Size', 'Size range', 'Размеры', 'Размерный ряд'],
  standard: ['执行标准', '标准', 'Standard', 'Стандарт'],
  structure: ['结构', 'Structure', 'Структура'],
};

function normalizeFactLabel(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s:：/／|｜-]+/g, '');
}

function localizedSpecifications(product: Product, locale: Locale) {
  return product.specifications
    .map((specification) => {
      const label = localized(specification.label, locale).trim();
      const value = specValue(specification.value, locale).trim();

      return {
        label,
        normalizedLabel: normalizeFactLabel(label),
        value,
      };
    })
    .filter((specification) => specification.label && specification.value);
}

function textList(values: readonly string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' / ');
}

function consumeSpecificationValue(
  specifications: ReturnType<typeof localizedSpecifications>,
  usedLabels: Set<string>,
  label: string,
  aliases: readonly string[],
) {
  const normalizedLabels = new Set([label, ...aliases].map(normalizeFactLabel));
  const match = specifications.find((specification) =>
    normalizedLabels.has(specification.normalizedLabel),
  );

  if (!match) {
    return '';
  }

  usedLabels.add(match.normalizedLabel);

  return match.value;
}

function detailFact(label: string, value: string): ProductDetailFact | null {
  const cleanValue = value.trim();

  return cleanValue ? { label, value: cleanValue } : null;
}

export function buildProductDetailFacts(
  product: Product,
  locale: Locale,
  labels: ProductDetailFactLabels,
) {
  const specifications = localizedSpecifications(product, locale);
  const usedSpecificationLabels = new Set<string>();
  const pick = (key: ProductDetailFactKey) =>
    consumeSpecificationValue(
      specifications,
      usedSpecificationLabels,
      labels[key],
      factLabelAliases[key],
    );
  const materials = product.materials
    .map((material) => localized(material, locale))
    .filter(Boolean);
  const category = localized(product.categoryName, locale);
  const modelFromSpec = pick('model');
  const standardFromSpec = pick('standard');
  const colorFromSpec = pick('color');
  const sizeRangeFromSpec = pick('sizeRange');
  const materialsFromSpec = pick('materials');
  const categoryFromSpec = pick('category');
  const structureFromSpec = pick('structure');
  const facts = [
    detailFact(labels.model, product.model || modelFromSpec),
    detailFact(labels.standard, textList(product.standards) || standardFromSpec),
    detailFact(labels.color, colorFromSpec),
    detailFact(labels.sizeRange, textList(product.sizeRange ?? []) || sizeRangeFromSpec),
    detailFact(labels.materials, materials.slice(0, 3).join(' / ') || materialsFromSpec),
    detailFact(labels.category, category || categoryFromSpec),
    detailFact(labels.structure, structureFromSpec),
  ].filter((fact): fact is ProductDetailFact => Boolean(fact));
  const additionalSpecifications: ProductDetailSpecification[] = specifications
    .filter((specification) => !usedSpecificationLabels.has(specification.normalizedLabel))
    .map((specification) => ({
      label: specification.label,
      value: specification.value,
    }));

  return {
    additionalSpecifications,
    facts,
  };
}
