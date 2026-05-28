import { productPrimaryImage } from '@/lib/content/productVisuals';
import type { Locale } from '@/lib/i18n/locale';

export type LocalizedText = Readonly<Record<Locale, string>>;

export type CatalogGroupId = string;

export type ProductGroupId = CatalogGroupId;

export type CatalogCategory = Readonly<{
  id: string;
  groupId: CatalogGroupId;
  officialCount: number;
  productIds: readonly string[];
  title: LocalizedText;
}>;

export type CatalogCmsProduct = Readonly<{
  id: string;
  productId?: string;
  slug?: string;
  model: string;
  sku?: string;
  categoryId: string;
  categoryName: LocalizedText;
  groupId: CatalogGroupId;
  name: LocalizedText;
  description: LocalizedText;
  image: string;
  images?: readonly string[];
  standards: readonly string[];
  features: readonly LocalizedText[];
}>;

export type CatalogSlotStatus = 'preparing' | 'published';

export type CatalogSlot = Readonly<{
  categoryDescription: LocalizedText;
  categoryId: string;
  categoryIndex: number;
  categoryTitle: LocalizedText;
  cmsProduct: CatalogCmsProduct | null;
  description: LocalizedText;
  fallbackTitle: LocalizedText;
  groupId: ProductGroupId;
  image: string;
  model: string;
  number: string;
  sequence: number;
  slotId: string;
  standards: readonly string[];
  status: CatalogSlotStatus;
  title: LocalizedText;
}>;

export type CatalogHashTarget = Readonly<{
  categoryIds: readonly string[];
  groupId: ProductGroupId;
}>;

const placeholderProductImage = '';
const firefighterProductImage = '/images/products/extracted/firefighter-suit-combat/image-001.png';

export function localized(value: LocalizedText, locale: Locale) {
  return value[locale] || value.zh;
}

export const catalogGroups: ReadonlyArray<{
  id: CatalogGroupId;
  titleKey: string;
}> = [
  { id: 'fire-rescue', titleKey: 'product.group.fireRescue' },
  { id: 'electrical-protection', titleKey: 'product.group.electrical' },
  { id: 'thermal-welding', titleKey: 'product.group.thermal' },
  { id: 'chemical-medical', titleKey: 'product.group.chemicalMedical' },
  { id: 'water-rescue', titleKey: 'product.group.waterRescue' },
];

export const catalogCategories: readonly CatalogCategory[] = [
  {
    id: 'firefighter-suit',
    groupId: 'fire-rescue',
    officialCount: 2,
    productIds: ['firefighter-suit-combat'],
    title: {
      zh: '消防员灭火防护服',
      en: 'Firefighter protective suits',
      ru: 'Пожарные защитные костюмы',
    },
  },
  {
    id: 'rescue-suit',
    groupId: 'fire-rescue',
    officialCount: 2,
    productIds: [],
    title: {
      zh: '消防员抢险救援服',
      en: 'Firefighter rescue suits',
      ru: 'Спасательные костюмы пожарных',
    },
  },
  {
    id: 'forest-fire',
    groupId: 'fire-rescue',
    officialCount: 1,
    productIds: [],
    title: {
      zh: '森林灭火防护装备',
      en: 'Forest firefighting suits',
      ru: 'Костюмы для лесных пожаров',
    },
  },
  {
    id: 'arc-flash',
    groupId: 'electrical-protection',
    officialCount: 7,
    productIds: ['arc-flash-suit'],
    title: {
      zh: '防电弧服',
      en: 'Arc flash suits',
      ru: 'Костюмы защиты от дуги',
    },
  },
  {
    id: 'shielding',
    groupId: 'electrical-protection',
    officialCount: 3,
    productIds: ['live-line-shielding-suit'],
    title: {
      zh: '带电作业用屏蔽服',
      en: 'Live-line shielding suits',
      ru: 'Экранирующие костюмы',
    },
  },
  {
    id: 'high-voltage-static',
    groupId: 'electrical-protection',
    officialCount: 1,
    productIds: ['insulating-gloves'],
    title: {
      zh: '交流高压静电服',
      en: 'High-voltage anti-static suits',
      ru: 'Антистатические костюмы для высокого напряжения',
    },
  },
  {
    id: 'anti-static',
    groupId: 'electrical-protection',
    officialCount: 3,
    productIds: [],
    title: {
      zh: '防静电服',
      en: 'Anti-static clothing',
      ru: 'Антистатическая одежда',
    },
  },
  {
    id: 'microwave-radiation',
    groupId: 'chemical-medical',
    officialCount: 2,
    productIds: [],
    title: {
      zh: '微波辐射防护服',
      en: 'Microwave radiation protection',
      ru: 'Защита от СВЧ-излучения',
    },
  },
  {
    id: 'welding',
    groupId: 'thermal-welding',
    officialCount: 2,
    productIds: ['welding-protective-clothing'],
    title: {
      zh: '焊接服',
      en: 'Welding protection',
      ru: 'Сварочная защита',
    },
  },
  {
    id: 'flame-retardant',
    groupId: 'thermal-welding',
    officialCount: 1,
    productIds: [],
    title: {
      zh: '阻燃服',
      en: 'Flame-resistant clothing',
      ru: 'Огнестойкая одежда',
    },
  },
  {
    id: 'splash-protection',
    groupId: 'thermal-welding',
    officialCount: 1,
    productIds: [],
    title: {
      zh: '防喷溅服',
      en: 'Splash protection',
      ru: 'Защита от брызг',
    },
  },
  {
    id: 'chemical',
    groupId: 'chemical-medical',
    officialCount: 2,
    productIds: ['chemical-protective-suit', 'medical-protective-clothing'],
    title: {
      zh: '防化服',
      en: 'Chemical protection',
      ru: 'Химическая защита',
    },
  },
  {
    id: 'fr-anti-static',
    groupId: 'chemical-medical',
    officialCount: 3,
    productIds: [],
    title: {
      zh: '阻燃防静电服',
      en: 'FR anti-static clothing',
      ru: 'Огнестойкая антистатическая одежда',
    },
  },
  {
    id: 'water-rescue-suit',
    groupId: 'water-rescue',
    officialCount: 2,
    productIds: [],
    title: {
      zh: '水域救援服',
      en: 'Water rescue suits',
      ru: 'Костюмы для спасения на воде',
    },
  },
  {
    id: 'water-rescue-accessories',
    groupId: 'water-rescue',
    officialCount: 6,
    productIds: [],
    title: {
      zh: '水域救援配套装备',
      en: 'Water rescue accessories',
      ru: 'Снаряжение для спасения на воде',
    },
  },
];

export const catalogGroupIds = catalogGroups.map((group) => group.id);

const catalogGroupIdSet = new Set<string>(catalogGroupIds);

const categoryDescriptions: Record<string, LocalizedText> = {
  'anti-static': {
    zh: '面向电子、洁净和易燃易爆环境的静电风险控制服装。',
    en: 'Static-control apparel for electronics, clean, and flammable work areas.',
    ru: 'Одежда для контроля статического заряда в электронных и чистых зонах.',
  },
  'arc-flash': {
    zh: '覆盖电气检修、倒闸和电弧热危害场景的防护服系列。',
    en: 'Arc-rated protection for electrical maintenance, switching, and arc hazard work.',
    ru: 'Защита от дуги для обслуживания, переключений и электротехнических работ.',
  },
  chemical: {
    zh: '用于危化品处置、化工检修、实验室和医疗隔离等场景。',
    en: 'For hazmat response, chemical maintenance, laboratories, and medical isolation.',
    ru: 'Для HazMat, химического обслуживания, лабораторий и медицинской изоляции.',
  },
  'firefighter-suit': {
    zh: '用于灭火救援、应急抢险和灾害处置的一线消防防护。',
    en: 'Frontline firefighting protection for rescue, emergency, and disaster response.',
    ru: 'Пожарная защита для спасательных, аварийных и чрезвычайных работ.',
  },
  'flame-retardant': {
    zh: '适合热源、明火和工业检修环境的阻燃基础防护。',
    en: 'Flame-resistant baseline protection for heat, flame, and industrial maintenance.',
    ru: 'Базовая огнестойкая защита для тепла, пламени и промышленного обслуживания.',
  },
  'forest-fire': {
    zh: '面向森林草原火灾扑救和户外长时间作业的轻量化防护。',
    en: 'Lightweight protection for wildland firefighting and extended outdoor work.',
    ru: 'Легкая защита для лесных пожаров и длительных наружных работ.',
  },
  'fr-anti-static': {
    zh: '兼顾阻燃和防静电需求，适用于石化、能源和工业现场。',
    en: 'Combines flame resistance and static control for petrochemical and energy sites.',
    ru: 'Огнестойкость и антистатика для нефтехимии, энергетики и промышленных объектов.',
  },
  'high-voltage-static': {
    zh: '用于交流高压和带电风险环境的静电防护配套。',
    en: 'Static protection support for AC high-voltage and energized work environments.',
    ru: 'Антистатическая защита для высоковольтных и токоведущих сред.',
  },
  'microwave-radiation': {
    zh: '面向微波、电磁辐射相关岗位的专用屏蔽防护。',
    en: 'Dedicated shielding protection for microwave and electromagnetic exposure roles.',
    ru: 'Специализированное экранирование от СВЧ и электромагнитного воздействия.',
  },
  'rescue-suit': {
    zh: '适合抢险救援、破拆、搜救和综合应急处置的防护服。',
    en: 'Rescue apparel for rescue, demolition, search, and emergency response tasks.',
    ru: 'Спасательная одежда для аварийных, поисковых и спасательных работ.',
  },
  shielding: {
    zh: '服务高压带电作业、等电位作业和成套电力防护配置。',
    en: 'For high-voltage live-line work, equipotential tasks, and electrical PPE sets.',
    ru: 'Для работ под напряжением, эквипотенциальных задач и комплектов СИЗ.',
  },
  'splash-protection': {
    zh: '面向熔融金属、喷溅和高温颗粒风险的局部强化防护。',
    en: 'Reinforced protection against molten metal, splash, and high-temperature particles.',
    ru: 'Усиленная защита от расплава, брызг и высокотемпературных частиц.',
  },
  welding: {
    zh: '覆盖焊接、切割、打磨和热作业场景的阻燃耐热防护。',
    en: 'Flame and heat protection for welding, cutting, grinding, and hot work.',
    ru: 'Огне- и теплозащита для сварки, резки, шлифования и горячих работ.',
  },
  'water-rescue-accessories': {
    zh: '水域救援头盔、手套、靴、割绳刀、救生衣和连接装备。',
    en: 'Helmets, gloves, boots, cutting tools, life vests, and connection gear for water rescue.',
    ru: 'Шлемы, перчатки, ботинки, ножи, жилеты и соединительное снаряжение для спасения на воде.',
  },
  'water-rescue-suit': {
    zh: '用于激流、洪涝和开放水域救援的干式与湿式防护服。',
    en: 'Dry and wet suits for swiftwater, flood, and open-water rescue.',
    ru: 'Сухие и мокрые костюмы для спасения на быстром течении, при наводнениях и на открытой воде.',
  },
};

export const catalogIndustryHashTargets: Record<string, CatalogHashTarget> = {
  'industry-electronics': {
    categoryIds: ['anti-static'],
    groupId: 'electrical-protection',
  },
  'industry-emergency': {
    categoryIds: ['firefighter-suit', 'rescue-suit', 'forest-fire'],
    groupId: 'fire-rescue',
  },
  'industry-equipment': {
    categoryIds: ['welding'],
    groupId: 'thermal-welding',
  },
  'industry-food': {
    categoryIds: ['chemical'],
    groupId: 'chemical-medical',
  },
  'industry-manufacturing': {
    categoryIds: ['welding'],
    groupId: 'thermal-welding',
  },
  'industry-medical': {
    categoryIds: ['microwave-radiation'],
    groupId: 'chemical-medical',
  },
  'industry-metal': {
    categoryIds: ['splash-protection', 'flame-retardant'],
    groupId: 'thermal-welding',
  },
  'industry-petrochemical': {
    categoryIds: ['fr-anti-static'],
    groupId: 'chemical-medical',
  },
  'industry-power': {
    categoryIds: ['arc-flash', 'shielding', 'high-voltage-static'],
    groupId: 'electrical-protection',
  },
};

export function isCatalogGroupId(value: unknown): value is CatalogGroupId {
  return typeof value === 'string' && catalogGroupIdSet.has(value);
}

export function catalogSlotNumber(sequence: number) {
  return `NO.${String(sequence).padStart(2, '0')}`;
}

function slotProductId(category: CatalogCategory, index: number) {
  const existingId = category.productIds[index];

  if (existingId) {
    return existingId;
  }

  if (category.officialCount === 1) {
    return category.id;
  }

  return `${category.id}-${String(index + 1).padStart(2, '0')}`;
}

function slotTitle(category: CatalogCategory, index: number): LocalizedText {
  if (category.officialCount === 1) {
    return category.title;
  }

  const slotNumber = String(index + 1).padStart(2, '0');

  return {
    zh: `${category.title.zh} ${slotNumber}`,
    en: `${category.title.en} ${slotNumber}`,
    ru: `${category.title.ru} ${slotNumber}`,
  };
}

function normalizeProductKey(value: string | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function catalogProductKeys(product: CatalogCmsProduct) {
  const productId = normalizeProductKey(product.productId);

  if (productId) {
    return [productId];
  }

  return [normalizeProductKey(product.id), normalizeProductKey(product.slug)].filter(
    (key, index, keys): key is string => Boolean(key) && keys.indexOf(key) === index,
  );
}

function indexCmsProductsByCatalogId(cmsProducts: readonly CatalogCmsProduct[]) {
  const productsByCatalogId = new Map<string, CatalogCmsProduct>();

  for (const product of cmsProducts) {
    for (const key of catalogProductKeys(product)) {
      if (!productsByCatalogId.has(key)) {
        productsByCatalogId.set(key, product);
      }
    }
  }

  return productsByCatalogId;
}

function safeCatalogImage(src: string | undefined) {
  if (!src) {
    return placeholderProductImage;
  }

  if (src.startsWith('/media/modeling-jacket-front')) {
    return firefighterProductImage;
  }

  return src;
}

export function buildCatalogSlots(
  cmsProducts: readonly CatalogCmsProduct[],
): readonly CatalogSlot[] {
  const productsByCatalogId = indexCmsProductsByCatalogId(cmsProducts);
  let sequence = 0;

  return catalogCategories.flatMap((category) =>
    Array.from({ length: category.officialCount }, (_, index) => {
      sequence += 1;

      const slotId = slotProductId(category, index);
      const cmsProduct = productsByCatalogId.get(slotId) ?? null;
      const fallbackTitle = slotTitle(category, index);
      const categoryDescription = categoryDescriptions[category.id] ?? category.title;

      return {
        categoryDescription,
        categoryId: category.id,
        categoryIndex: index + 1,
        categoryTitle: category.title,
        cmsProduct,
        description: cmsProduct?.description ?? categoryDescription,
        fallbackTitle,
        groupId: category.groupId,
        image: safeCatalogImage(cmsProduct ? productPrimaryImage(cmsProduct) : undefined),
        model: cmsProduct?.model ?? `YF-CAT-${String(sequence).padStart(2, '0')}`,
        number: catalogSlotNumber(sequence),
        sequence,
        slotId,
        standards: cmsProduct?.standards ?? [],
        status: cmsProduct ? 'published' : 'preparing',
        title: cmsProduct?.name ?? fallbackTitle,
      } satisfies CatalogSlot;
    }),
  );
}

export function countCatalogSlotsByGroup(slots: readonly CatalogSlot[]) {
  const counts = Object.fromEntries(catalogGroupIds.map((groupId) => [groupId, 0])) as Record<
    string,
    number
  >;

  for (const slot of slots) {
    counts[slot.groupId] = (counts[slot.groupId] ?? 0) + 1;
  }

  return counts;
}

export function filterCatalogSlots(
  slots: readonly CatalogSlot[],
  locale: Locale,
  query: string,
): readonly CatalogSlot[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return slots;
  }

  return slots.filter((slot) => {
    const haystack = [
      slot.slotId,
      slot.number,
      slot.model,
      localized(slot.title, locale),
      localized(slot.fallbackTitle, locale),
      localized(slot.categoryTitle, locale),
      localized(slot.categoryDescription, locale),
      slot.cmsProduct?.sku,
      ...(slot.cmsProduct?.features.map((feature) => localized(feature, locale)) ?? []),
      ...slot.standards,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function resolveCatalogHashTarget(hashId: string): CatalogHashTarget | null {
  const normalizedHashId = hashId.replace(/^#/, '').trim();

  if (!normalizedHashId) {
    return null;
  }

  if (isCatalogGroupId(normalizedHashId)) {
    return {
      categoryIds: [],
      groupId: normalizedHashId,
    };
  }

  const category = catalogCategories.find((item) => item.id === normalizedHashId);

  if (category) {
    return {
      categoryIds: [category.id],
      groupId: category.groupId,
    };
  }

  return catalogIndustryHashTargets[normalizedHashId] ?? null;
}

export function getCatalogHashTargets() {
  const targets: Record<string, CatalogHashTarget> = {};

  for (const groupId of catalogGroupIds) {
    targets[groupId] = {
      categoryIds: [],
      groupId,
    };
  }

  for (const category of catalogCategories) {
    targets[category.id] = {
      categoryIds: [category.id],
      groupId: category.groupId,
    };
  }

  for (const [hashId, target] of Object.entries(catalogIndustryHashTargets)) {
    targets[hashId] = target;
  }

  return targets;
}
