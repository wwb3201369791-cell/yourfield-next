import type { Locale } from '@/lib/i18n/locale';
import { localizedPublicText } from '@/lib/product/publicText';
import type { Product } from '@/lib/product/types';

export type ProductSeoKeywordInput = Readonly<{
  applications?: readonly string[];
  categoryId?: string;
  categoryName?: string;
  description?: string;
  features?: readonly string[];
  groupId?: string;
  materials?: readonly string[];
  model?: string;
  name?: string;
  productId?: string;
  sku?: string;
  standards?: readonly string[];
}>;

const maxSeoTerms = 18;

const genericLocaleTerms = {
  en: ['PPE manufacturer', 'protective clothing supplier', 'industrial safety PPE'],
  ru: ['производитель СИЗ', 'поставщик защитной одежды', 'промышленные СИЗ'],
  zh: ['防护服厂家', 'PPE 制造商', '工业防护用品供应商'],
} as const satisfies Record<Locale, readonly string[]>;

const groupKeywordSets = {
  'chemical-medical': {
    en: [
      'Chemical Protective Suit',
      'Chemical Protective Suit Manufacturer',
      'Chemical Resistant Clothing',
      'Hazmat Suit',
      'Disposable Protective Clothing',
      'Cleanroom Suit',
      'Medical Protective Clothing',
    ],
    ru: [
      'костюм химической защиты',
      'производитель химических защитных костюмов',
      'химически стойкая одежда',
      'одноразовая защитная одежда',
      'одежда для чистых помещений',
      'медицинская защитная одежда',
    ],
    zh: [
      '化学防护服',
      '化学防护服厂家',
      '防化服',
      '防化服供应商',
      '一次性防护服',
      '洁净服',
      '医疗防护服',
    ],
  },
  'electrical-protection': {
    en: [
      'Arc Flash Clothing',
      'Arc Flash Clothing Manufacturer',
      'Arc Flash Suit',
      'Arc Rated PPE',
      'ATPV Arc Flash Clothing',
      'IEC 61482 Arc Flash Clothing',
      'Electrical Safety PPE',
    ],
    ru: [
      'одежда для защиты от электрической дуги',
      'производитель дугостойкой одежды',
      'дугостойкий костюм',
      'СИЗ для электробезопасности',
      'IEC 61482 одежда от дуговой вспышки',
    ],
    zh: [
      '防电弧服',
      '防电弧服厂家',
      '防电弧工作服',
      '防电弧套装',
      '电力防护服',
      '电力 PPE',
      'ATPV 防电弧服',
    ],
  },
  'fire-rescue': {
    en: [
      'Firefighter Protective Clothing',
      'Firefighter Protective Clothing Manufacturer',
      'Firefighter Turnout Gear',
      'Fire Rescue PPE',
      'Fire Fighting Suit',
      'Emergency Rescue Protective Clothing',
    ],
    ru: [
      'боевая одежда пожарного',
      'производитель пожарной защитной одежды',
      'снаряжение пожарного',
      'СИЗ для пожарных',
      'аварийно-спасательная защитная одежда',
    ],
    zh: [
      '消防员灭火防护服',
      '消防员灭火防护服厂家',
      '消防战斗服',
      '消防防护服厂家',
      '抢险救援服',
      '森林防火服',
      '应急救援防护装备',
    ],
  },
  'thermal-welding': {
    en: [
      'Flame Resistant Clothing',
      'Flame Resistant Clothing Manufacturer',
      'FR Coveralls',
      'FR Coveralls Manufacturer',
      'FR Workwear',
      'Welding Protective Clothing',
      'Molten Metal Splash Protective Clothing',
      'Anti Static Workwear',
    ],
    ru: [
      'огнестойкая одежда',
      'производитель огнестойкой одежды',
      'огнестойкий комбинезон',
      'сварочная защитная одежда',
      'одежда от брызг расплавленного металла',
      'антистатическая рабочая одежда',
    ],
    zh: [
      '阻燃服',
      '阻燃防护服',
      '阻燃防护服厂家',
      '阻燃连体服',
      '阻燃连体服厂家',
      '阻燃防静电服',
      '工业阻燃工装',
      '焊接防护服',
      '熔融金属飞溅防护服',
    ],
  },
  'water-rescue': {
    en: [
      'Water Rescue Suit',
      'Dry Water Rescue Suit',
      'Water Rescue PPE',
      'Swiftwater Rescue Gear',
      'Flood Rescue Suit',
      'Water Rescue Equipment',
    ],
    ru: [
      'костюм для спасения на воде',
      'сухой спасательный костюм',
      'СИЗ для спасения на воде',
      'снаряжение для спасения на воде',
      'костюм для спасения при наводнениях',
    ],
    zh: [
      '水域救援服',
      '干式水域救援服',
      '水域救援装备',
      '激流救援装备',
      '抗洪抢险救援服',
      '水域救援 PPE',
    ],
  },
} as const satisfies Record<string, Record<Locale, readonly string[]>>;

const groupMatchers: ReadonlyArray<
  Readonly<{ groupId: keyof typeof groupKeywordSets; patterns: readonly RegExp[] }>
> = [
  {
    groupId: 'electrical-protection',
    patterns: [/electrical|arc|electric|power|电弧|电力|静电|屏蔽|高压|带电/i],
  },
  {
    groupId: 'fire-rescue',
    patterns: [/fire|rescue|firefighter|turnout|消防|灭火|抢险|救援|森林防火|应急/i],
  },
  {
    groupId: 'thermal-welding',
    patterns: [
      /thermal|welding|flame|fr\b|heat|molten|anti.?static|阻燃|焊接|热防护|熔融|飞溅|防静电/i,
    ],
  },
  {
    groupId: 'chemical-medical',
    patterns: [
      /chemical|medical|cleanroom|hazmat|disposable|化学|防化|洁净|医疗|隔离|微波|一次性/i,
    ],
  },
  {
    groupId: 'water-rescue',
    patterns: [/water|flood|swiftwater|水域|抗洪|干式|救生|激流/i],
  },
];

function normalizeTerm(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function uniqueTerms(values: readonly string[]) {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const value of values.map(normalizeTerm).filter(Boolean)) {
    const key = value.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      terms.push(value);
    }
  }

  return terms;
}

function compactIdentifier(value: string) {
  const compact = value.replace(/[^\p{L}\p{N}]/gu, '');

  return compact && compact !== value ? compact : '';
}

function standardTerms(standards: readonly string[] | undefined, locale: Locale) {
  const values = standards ?? [];

  if (locale === 'zh') {
    return values;
  }

  return values.flatMap(
    (standard) => standard.match(/[A-Z]{2,}[A-Z0-9.\/-]*\d[A-Z0-9.\/-]*/g) ?? [],
  );
}

function inferKeywordGroups(input: ProductSeoKeywordInput) {
  const explicitGroupId = normalizeTerm(input.groupId ?? '');
  const explicitCategoryId = normalizeTerm(input.categoryId ?? '');
  const explicit = [explicitGroupId, explicitCategoryId].find(
    (value): value is keyof typeof groupKeywordSets => value in groupKeywordSets,
  );

  if (explicit) {
    return [explicit];
  }

  // Infer broad SEO keyword families only from high-signal product taxonomy and identity.
  // Descriptions, features, and materials often mention cross-cutting properties such as
  // “阻燃材料” on non-FR products; using them here makes generic procurement queries
  // rank unrelated products equally.
  const haystack = [
    input.groupId,
    input.categoryId,
    input.categoryName,
    input.name,
    ...(input.applications ?? []),
    ...(input.standards ?? []),
  ]
    .filter(Boolean)
    .join(' ');

  return groupMatchers
    .filter((matcher) => matcher.patterns.some((pattern) => pattern.test(haystack)))
    .map((matcher) => matcher.groupId);
}

function localizedProcurementTerms(name: string, locale: Locale) {
  if (!name) {
    return [];
  }

  if (locale === 'zh') {
    return [`${name}厂家`, `${name}制造商`, `${name}供应商`];
  }

  if (locale === 'ru') {
    return [`производитель ${name}`, `поставщик ${name}`];
  }

  return [`${name} manufacturer`, `${name} supplier`];
}

export function buildProductSeoKeywords(input: ProductSeoKeywordInput, locale: Locale) {
  const name = normalizeTerm(input.name ?? '');
  const model = normalizeTerm(input.model ?? '');
  const sku = normalizeTerm(input.sku ?? '');
  const productId = normalizeTerm(input.productId ?? '');
  const categoryName = normalizeTerm(input.categoryName ?? '');
  const identifiers = uniqueTerms([
    model,
    sku,
    productId,
    compactIdentifier(model),
    compactIdentifier(sku),
    compactIdentifier(productId),
  ]);
  const groupTerms = inferKeywordGroups(input).flatMap(
    (groupId) => groupKeywordSets[groupId][locale],
  );
  const allTerms = uniqueTerms([
    name,
    ...localizedProcurementTerms(name, locale),
    categoryName,
    ...groupTerms,
    ...genericLocaleTerms[locale],
    ...standardTerms(input.standards, locale),
    ...identifiers,
  ]);

  return allTerms.slice(0, maxSeoTerms);
}

export function productSeoKeywordInput(product: Product, locale: Locale): ProductSeoKeywordInput {
  return {
    applications: product.applications
      .map((application) => localizedPublicText(application, locale))
      .filter(Boolean),
    categoryId: product.categoryId,
    categoryName: localizedPublicText(product.categoryName, locale),
    description: localizedPublicText(product.description, locale),
    features: product.features
      .map((feature) => localizedPublicText(feature, locale))
      .filter(Boolean),
    groupId: product.groupId,
    materials: product.materials
      .map((material) => localizedPublicText(material, locale))
      .filter(Boolean),
    model: product.model,
    name: localizedPublicText(product.name, locale),
    productId: product.id,
    ...(product.sku ? { sku: product.sku } : {}),
    standards: product.standards,
  };
}

export function productSeoKeywords(product: Product, locale: Locale) {
  return buildProductSeoKeywords(productSeoKeywordInput(product, locale), locale);
}
