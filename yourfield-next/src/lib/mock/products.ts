import type { Locale } from '@/lib/i18n/locale';

export type LocalizedText = Readonly<Record<Locale, string>>;

export type ProductGroupId = string;

export type ProductCategory = Readonly<{
  id: string;
  groupId: ProductGroupId;
  officialCount: number;
  productIds: readonly string[];
  title: LocalizedText;
}>;

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

const sharedProductImage = '/images/products/extracted/firefighter-suit-combat/image-001.png';

export const productGroups: ReadonlyArray<{
  id: ProductGroupId;
  titleKey: string;
}> = [
  { id: 'fire-rescue', titleKey: 'product.group.fireRescue' },
  { id: 'electrical-protection', titleKey: 'product.group.electrical' },
  { id: 'thermal-welding', titleKey: 'product.group.thermal' },
  { id: 'chemical-medical', titleKey: 'product.group.chemicalMedical' },
  { id: 'water-rescue', titleKey: 'product.group.waterRescue' },
];

export const productCategories: readonly ProductCategory[] = [
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
];

const commonFaqs: readonly ProductFaq[] = [
  {
    question: {
      zh: '询价时需要提供哪些信息？',
      en: 'What information is needed for a quotation?',
      ru: 'Какая информация нужна для расчета цены?',
    },
    answer: {
      zh: '建议提供应用场景、执行标准、数量、尺码范围、目的市场和所需资料文件。',
      en: 'Please provide application scenario, required standard, quantity, size range, destination market, and requested documents.',
      ru: 'Укажите сценарий применения, требуемый стандарт, количество, размерный ряд, рынок назначения и нужные документы.',
    },
  },
];

function categoryFor(id: string) {
  const category = productCategories.find((item) => item.id === id);

  if (!category) {
    throw new Error(`Unknown product category: ${id}`);
  }

  return category;
}

const realProducts: readonly Product[] = [
  {
    id: 'firefighter-suit-combat',
    model: 'HYF-5506',
    sku: 'HYF-5506',
    categoryId: 'firefighter-suit',
    categoryName: categoryFor('firefighter-suit').title,
    groupId: 'fire-rescue',
    name: {
      zh: '消防员灭火防护服（作战款）',
      en: 'Firefighter Protective Suit (Combat Style)',
      ru: 'Пожарный защитный костюм (боевой тип)',
    },
    description: {
      zh: '作战款消防员灭火防护服采用三层芳纶复合结构，面向灭火救援、应急抢险和灾害处置作业，提供阻燃隔热、防水透湿、高强耐用及防静电等综合防护。',
      en: 'The combat-style firefighter protective suit uses a three-layer aramid composite structure for firefighting, emergency rescue, and disaster response.',
      ru: 'Пожарный защитный костюм боевого типа выполнен из трехслойной арамидной композитной структуры для тушения пожаров и спасательных работ.',
    },
    image: '/images/products/official/firefighter-suit-combat-combat-01.png',
    images: [
      '/images/products/official/firefighter-suit-combat-combat-01.png',
      '/images/products/official/firefighter-suit-combat-combat-02.png',
      '/images/products/official/firefighter-suit-combat-combat-03.png',
      '/images/products/official/firefighter-suit-combat-combat-04.png',
    ],
    standards: ['XF10-2014'],
    materials: [
      {
        zh: '三层芳纶复合结构',
        en: 'Three-layer aramid composite structure',
        ru: 'Трехслойная арамидная композитная структура',
      },
      {
        zh: 'PTFE 防水透气隔热层',
        en: 'PTFE waterproof breathable insulation layer',
        ru: 'PTFE водонепроницаемый дышащий теплоизоляционный слой',
      },
    ],
    applications: [
      {
        zh: '消防员灭火救援作业',
        en: 'Firefighting and rescue operations',
        ru: 'Пожаротушение и спасательные работы',
      },
      {
        zh: '应急抢险与灾害处置',
        en: 'Emergency rescue and disaster response',
        ru: 'Аварийно-спасательные работы и ликвидация ЧС',
      },
    ],
    features: [
      { zh: '阻燃隔热', en: 'Flame and heat resistance', ru: 'Огнестойкость и теплоизоляция' },
      { zh: '防水透湿', en: 'Waterproof and breathable', ru: 'Водозащита и паропроницаемость' },
      { zh: '高强耐用', en: 'Durable structure', ru: 'Прочная конструкция' },
      {
        zh: '导电防静电',
        en: 'Conductive anti-static design',
        ru: 'Проводящая антистатическая конструкция',
      },
    ],
    specifications: [
      {
        label: { zh: '型号', en: 'Model', ru: 'Модель' },
        value: 'HYF-5506',
      },
      {
        label: { zh: '执行标准', en: 'Standard', ru: 'Стандарт' },
        value: 'XF10-2014',
      },
      {
        label: { zh: '颜色', en: 'Color', ru: 'Цвет' },
        value: { zh: '藏蓝色', en: 'Navy blue', ru: 'Темно-синий' },
      },
      {
        label: { zh: '尺码', en: 'Size range', ru: 'Размерный ряд' },
        value: '165A-190B',
      },
    ],
    faqs: [
      {
        question: {
          zh: '消防服如何清洗维护？',
          en: 'How should the suit be cleaned and maintained?',
          ru: 'Как стирать и обслуживать костюм?',
        },
        answer: {
          zh: '使用中性洗涤剂，水温不超过 40 C；禁止使用漂白剂、酸性洗涤剂和柔软剂。',
          en: 'Use neutral detergent and water not above 40 C. Do not use bleach, acidic detergent, or softener.',
          ru: 'Используйте нейтральное моющее средство и воду не выше 40 C. Не применяйте отбеливатель.',
        },
      },
      ...commonFaqs,
    ],
  },
  {
    id: 'arc-flash-suit',
    model: 'Arc-Rated PPE',
    categoryId: 'arc-flash',
    categoryName: categoryFor('arc-flash').title,
    groupId: 'electrical-protection',
    name: { zh: '防电弧服', en: 'Arc Flash Suit', ru: 'Костюм защиты от дуги' },
    description: {
      zh: '面向电力检修、倒闸和带电风险场景的电弧热危害防护服，后续按客户确认资料补全等级和参数。',
      en: 'Arc-rated protective clothing for electrical maintenance and switching scenarios. Detailed ratings will be completed after content confirmation.',
      ru: 'Защитная одежда от дугового воздействия для электротехнических работ. Подробные параметры будут уточнены после подтверждения материалов.',
    },
    image: '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
    images: [
      '/images/products/official/arc-flash-suit-level-1-shirt-01.png',
      '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
      '/images/products/official/arc-flash-suit-level-3-coat-01.png',
    ],
    standards: ['GB 8965.1-2020'],
    materials: [
      {
        zh: '阻燃面料系统',
        en: 'Flame-resistant fabric system',
        ru: 'Огнестойкая тканевая система',
      },
    ],
    applications: [
      {
        zh: '电气检修与倒闸作业',
        en: 'Electrical maintenance and switching',
        ru: 'Электромонтаж и переключения',
      },
    ],
    features: [
      {
        zh: '电弧热风险防护',
        en: 'Arc thermal hazard protection',
        ru: 'Защита от теплового воздействия дуги',
      },
      { zh: '多等级配置', en: 'Multi-level configuration', ru: 'Многоуровневая комплектация' },
    ],
    specifications: [
      { label: { zh: '产品线', en: 'Product line', ru: 'Линейка' }, value: 'Arc-rated PPE' },
    ],
    faqs: commonFaqs,
  },
  {
    id: 'live-line-shielding-suit',
    model: '1000kV Shielding',
    categoryId: 'shielding',
    categoryName: categoryFor('shielding').title,
    groupId: 'electrical-protection',
    name: {
      zh: '带电作业用屏蔽服',
      en: 'Live-Line Shielding Suit',
      ru: 'Экранирующий костюм для работ под напряжением',
    },
    description: {
      zh: '面向高压带电作业团队的屏蔽防护服，预留后续按电压等级、配套件和检测资料完善。',
      en: 'Shielding protective clothing for high-voltage live-line teams, ready for voltage-level and accessory details in P2.',
      ru: 'Экранирующая защитная одежда для высоковольтных работ под напряжением.',
    },
    image: '/images/products/official/live-line-shielding-suit-1000kv-01.png',
    images: [
      '/images/products/official/live-line-shielding-suit-1000kv-01.png',
      '/images/products/official/live-line-shielding-suit-1000kv-02.png',
      '/images/products/official/live-line-shielding-suit-1000kv-03.png',
    ],
    standards: ['DL/T 1125'],
    materials: [
      {
        zh: '导电屏蔽材料',
        en: 'Conductive shielding material',
        ru: 'Проводящий экранирующий материал',
      },
    ],
    applications: [
      {
        zh: '高压带电检修',
        en: 'High-voltage live-line maintenance',
        ru: 'Высоковольтные работы под напряжением',
      },
    ],
    features: [
      { zh: '屏蔽防护', en: 'Shielding protection', ru: 'Экранирование' },
      { zh: '成套配置', en: 'Set-based configuration', ru: 'Комплектная поставка' },
    ],
    specifications: [
      {
        label: { zh: '适用场景', en: 'Use case', ru: 'Сценарий' },
        value: { zh: '带电作业', en: 'Live-line work', ru: 'Работы под напряжением' },
      },
    ],
    faqs: commonFaqs,
  },
  {
    id: 'insulating-gloves',
    model: 'Electrical Gloves',
    categoryId: 'high-voltage-static',
    categoryName: categoryFor('high-voltage-static').title,
    groupId: 'electrical-protection',
    name: { zh: '绝缘手套', en: 'Insulating Gloves', ru: 'Изолирующие перчатки' },
    description: {
      zh: '电气安全配套防护用品，作为产品中心占位详情，P2 阶段由正式产品资料替换。',
      en: 'Electrical safety accessory PPE. This P1 detail page is a placeholder for confirmed product data.',
      ru: 'Средство электрозащиты. Подробные данные будут заменены подтвержденными материалами на этапе P2.',
    },
    image: '',
    images: [],
    standards: ['IEC / GB standards to confirm'],
    materials: [
      {
        zh: '绝缘材料待确认',
        en: 'Insulating material to confirm',
        ru: 'Изоляционный материал уточняется',
      },
    ],
    applications: [
      {
        zh: '电气检修辅助防护',
        en: 'Electrical maintenance auxiliary protection',
        ru: 'Вспомогательная защита при электромонтаже',
      },
    ],
    features: [
      { zh: '电气安全配套', en: 'Electrical safety accessory', ru: 'Средство электрозащиты' },
      { zh: '资料待补全', en: 'Data to be completed', ru: 'Данные уточняются' },
    ],
    specifications: [
      {
        label: { zh: '资料状态', en: 'Data status', ru: 'Статус данных' },
        value: { zh: '整理中', en: 'In preparation', ru: 'В подготовке' },
      },
    ],
    faqs: commonFaqs,
  },
  {
    id: 'chemical-protective-suit',
    model: 'Chemical PPE',
    categoryId: 'chemical',
    categoryName: categoryFor('chemical').title,
    groupId: 'chemical-medical',
    name: { zh: '防化服', en: 'Chemical Protective Suit', ru: 'Костюм химической защиты' },
    description: {
      zh: '用于危化品处置、实验室和化工检修等场景的化学防护服预览，正式参数后续补全。',
      en: 'Chemical protection preview for hazardous-material handling, laboratories, and chemical maintenance.',
      ru: 'Предварительная карточка костюма химической защиты для работ с опасными веществами.',
    },
    image: '/images/products/official/chemical-protective-suit-disposable-chemical-a-01.png',
    images: [
      '/images/products/official/chemical-protective-suit-disposable-chemical-a-01.png',
      '/images/products/official/chemical-protective-suit-disposable-chemical-a-02.png',
      '/images/products/official/chemical-protective-suit-disposable-chemical-b-01.png',
    ],
    standards: ['Type / class to confirm'],
    materials: [
      { zh: '化学阻隔材料', en: 'Chemical barrier material', ru: 'Химический барьерный материал' },
    ],
    applications: [
      {
        zh: '危化品处置与化工检修',
        en: 'Hazmat response and chemical maintenance',
        ru: 'Работы с опасными веществами',
      },
    ],
    features: [
      { zh: '化学阻隔', en: 'Chemical barrier', ru: 'Химический барьер' },
      { zh: '污染隔离', en: 'Contamination isolation', ru: 'Изоляция загрязнений' },
    ],
    specifications: [
      {
        label: { zh: '防护类型', en: 'Protection type', ru: 'Тип защиты' },
        value: { zh: '防化', en: 'Chemical protection', ru: 'Химическая защита' },
      },
    ],
    faqs: commonFaqs,
  },
  {
    id: 'medical-protective-clothing',
    model: 'Medical PPE',
    categoryId: 'chemical',
    categoryName: categoryFor('chemical').title,
    groupId: 'chemical-medical',
    name: {
      zh: '医用防护服',
      en: 'Medical Protective Clothing',
      ru: 'Медицинская защитная одежда',
    },
    description: {
      zh: '面向医疗卫生、洁净隔离和应急防护场景的医用防护服预览。',
      en: 'Medical protective clothing preview for healthcare, clean isolation, and emergency protection scenarios.',
      ru: 'Предварительная карточка медицинской защитной одежды для здравоохранения и изоляции.',
    },
    image: '/images/products/official/medical-protective-clothing-official-local-01.jpg',
    images: [
      '/images/products/official/medical-protective-clothing-official-local-01.jpg',
      '/images/products/official/medical-protective-clothing-official-local-02.png',
      '/images/products/official/medical-protective-clothing-official-local-03.jpg',
    ],
    standards: ['Medical standard to confirm'],
    materials: [
      {
        zh: '医用防护材料',
        en: 'Medical protective material',
        ru: 'Медицинский защитный материал',
      },
    ],
    applications: [
      {
        zh: '医疗隔离与应急防护',
        en: 'Medical isolation and emergency protection',
        ru: 'Медицинская изоляция и аварийная защита',
      },
    ],
    features: [
      { zh: '医用隔离', en: 'Medical isolation', ru: 'Медицинская изоляция' },
      { zh: '量产交付', en: 'Manufacturing delivery', ru: 'Промышленная поставка' },
    ],
    specifications: [
      {
        label: { zh: '产品类型', en: 'Product type', ru: 'Тип изделия' },
        value: { zh: '医用防护', en: 'Medical protection', ru: 'Медицинская защита' },
      },
    ],
    faqs: commonFaqs,
  },
  {
    id: 'welding-protective-clothing',
    model: 'Welding PPE',
    categoryId: 'welding',
    categoryName: categoryFor('welding').title,
    groupId: 'thermal-welding',
    name: {
      zh: '焊接阻燃防护服',
      en: 'Welding Protective Clothing',
      ru: 'Защитная одежда для сварки',
    },
    description: {
      zh: '面向焊接、切割和热作业环境的阻燃防护服预览，可按工况补充成套配置。',
      en: 'Flame-resistant welding protection preview for welding, cutting, and thermal work environments.',
      ru: 'Предварительная карточка огнестойкой одежды для сварки, резки и термических работ.',
    },
    image: '/images/products/official/welding-protective-clothing-class-b-split-01.png',
    images: [
      '/images/products/official/welding-protective-clothing-class-b-split-01.png',
      '/images/products/official/welding-protective-clothing-class-b-split-02.png',
      '/images/products/official/welding-protective-clothing-cooling-split-01.png',
    ],
    standards: ['Welding protection standard to confirm'],
    materials: [
      {
        zh: '阻燃热防护材料',
        en: 'Flame-resistant thermal protective material',
        ru: 'Огнестойкий термозащитный материал',
      },
    ],
    applications: [
      {
        zh: '焊接、切割与热作业',
        en: 'Welding, cutting, and thermal work',
        ru: 'Сварка, резка и термические работы',
      },
    ],
    features: [
      { zh: '阻燃耐热', en: 'Flame and heat resistance', ru: 'Огнестойкость и теплостойкость' },
      { zh: '成套配置', en: 'Set-based configuration', ru: 'Комплектная поставка' },
    ],
    specifications: [
      {
        label: { zh: '产品类型', en: 'Product type', ru: 'Тип изделия' },
        value: { zh: '焊接防护', en: 'Welding protection', ru: 'Сварочная защита' },
      },
    ],
    faqs: commonFaqs,
  },
];

function slotProductId(category: ProductCategory, index: number) {
  const existingId = category.productIds[index];

  if (existingId) {
    return existingId;
  }

  if (category.officialCount === 1) {
    return category.id;
  }

  return `${category.id}-${String(index + 1).padStart(2, '0')}`;
}

function slotTitle(category: ProductCategory, index: number): LocalizedText {
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

function placeholderProduct(category: ProductCategory, index: number): Product {
  const name = slotTitle(category, index);

  return {
    id: slotProductId(category, index),
    model: `YF-${String(index + 1).padStart(2, '0')}`,
    categoryId: category.id,
    categoryName: category.title,
    groupId: category.groupId,
    name,
    description: {
      zh: '该产品公开详情正在整理中。如需参数、选型或项目资料，请联系销售团队获取。',
      en: 'Public product details are being prepared. Contact the sales team for specifications, selection support, or project documents.',
      ru: 'Публичные сведения об изделии готовятся. Свяжитесь с отделом продаж для параметров и проектных документов.',
    },
    image: sharedProductImage,
    images: [sharedProductImage],
    standards: [],
    materials: [],
    applications: [],
    features: [
      { zh: '资料待补全', en: 'Data to be completed', ru: 'Данные уточняются' },
      {
        zh: '支持项目咨询',
        en: 'Project consultation available',
        ru: 'Доступна консультация по проекту',
      },
    ],
    specifications: [
      {
        label: { zh: '资料状态', en: 'Data status', ru: 'Статус данных' },
        value: { zh: '整理中', en: 'In preparation', ru: 'В подготовке' },
      },
    ],
    faqs: commonFaqs,
    previewInherited: true,
  };
}

export const products: readonly Product[] = productCategories.flatMap((category) =>
  Array.from({ length: category.officialCount }, (_, index) => {
    const id = slotProductId(category, index);
    const realProduct = realProducts.find((product) => product.id === id);

    return realProduct ?? placeholderProduct(category, index);
  }),
);

export const featuredProducts = products.filter((product) =>
  [
    'firefighter-suit-combat',
    'arc-flash-suit',
    'live-line-shielding-suit',
    'chemical-protective-suit',
    'welding-protective-clothing',
    'medical-protective-clothing',
  ].includes(product.id),
);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.id === slug) ?? null;
}

export function getProductsByGroup(groupId: ProductGroupId) {
  return products.filter((product) => product.groupId === groupId);
}
