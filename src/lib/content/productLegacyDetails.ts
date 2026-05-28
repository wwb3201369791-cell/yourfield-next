import {
  localized,
  type LocalizedText,
  type Product,
  type ProductDetailCard,
  type ProductFaq,
  type ProductQualityEvidence,
  type ProductSizeGuide,
  type ProductSpec,
} from '@/lib/mock/products';

type LegacyProductDetail = Partial<
  Pick<
    Product,
    | 'applications'
    | 'careInstructions'
    | 'description'
    | 'faqs'
    | 'features'
    | 'materials'
    | 'model'
    | 'qualityEvidence'
    | 'scenarios'
    | 'sellingPoints'
    | 'sizeGuide'
    | 'specifications'
    | 'standards'
  >
>;

const text = (zh: string, en = zh, ru = zh): LocalizedText => ({ en, ru, zh });

const spec = (labelZh: string, valueZh: string, labelEn = labelZh, labelRu = labelZh): ProductSpec => ({
  label: text(labelZh, labelEn, labelRu),
  value: text(valueZh),
});

const card = (
  titleZh: string,
  textZh: string,
  titleEn = titleZh,
  textEn = textZh,
  titleRu = titleZh,
  textRu = textZh,
): ProductDetailCard => ({
  text: text(textZh, textEn, textRu),
  title: text(titleZh, titleEn, titleRu),
});

const firefighterSuitSizeGuide: ProductSizeGuide = {
  title: text('尺码对应表', 'Size guide', 'Таблица размеров'),
  cornerLabel: text('身高 cm / 体重 kg', 'Height cm / Weight kg', 'Рост см / Вес кг'),
  columns: ['50-55', '55-65', '65-75', '75-85', '80-90', '90-100', '100-110'],
  rows: [
    { label: '163-167', values: ['165A', '165B', '', '', '', '', ''] },
    { label: '168-172', values: ['', '170A', '170B', '', '', '', ''] },
    { label: '173-177', values: ['', '', '175A', '175B', '', '', ''] },
    { label: '178-182', values: ['', '', '', '180A', '180B', '', ''] },
    { label: '183-187', values: ['', '', '', '', '185A', '185B', ''] },
    { label: '188-192', values: ['', '', '', '', '', '190A', '190B'] },
  ],
};

const firefighterSuitEvidence: readonly ProductQualityEvidence[] = [
  {
    type: 'report',
    status: text('可联系获取', 'Available on request', 'Доступно по запросу'),
    title: text('检测报告', 'Test reports', 'Протоколы испытаний'),
    description: text(
      '如需检测报告、项目文件或盖章资料，请联系销售团队按项目需求提供。',
      'Contact the sales team for test reports, stamped project files, or current document support.',
      'Свяжитесь с отделом продаж для протоколов испытаний, заверенных проектных файлов или актуальных документов.',
    ),
  },
  {
    type: 'certificate',
    status: text('可联系获取', 'Available on request', 'Доступно по запросу'),
    title: text('认证文件', 'Certification files', 'Сертификационные файлы'),
    description: text(
      '认证及资质文件按客户项目、目的市场和使用场景提供。',
      'Certification and qualification files are supplied according to project, destination market, and use case.',
      'Сертификационные и квалификационные файлы предоставляются с учетом проекта, рынка назначения и условий применения.',
    ),
  },
];

const firefighterSuitFaqs: readonly ProductFaq[] = [
  {
    question: text(
      '消防服如何清洗维护？',
      'How should the suit be cleaned and maintained?',
      'Как стирать и обслуживать костюм?',
    ),
    answer: text(
      '使用中性洗涤剂，水温不超过 40 C；禁止使用漂白剂、酸性洗涤剂和柔软剂；出现磨损或烧毁等损伤时需专业修复或更换。',
      'Use neutral detergent and water not above 40 C. Do not use bleach, acidic detergent, or softener. Worn or burned parts require professional repair or replacement.',
      'Используйте нейтральное моющее средство и воду не выше 40 C. Не применяйте отбеливатель, кислотные средства и кондиционер. При износе или прожогах требуется профессиональный ремонт или замена.',
    ),
  },
  {
    question: text(
      '询价时需要提供哪些信息？',
      'What information is needed for a quotation?',
      'Какая информация нужна для расчета цены?',
    ),
    answer: text(
      '建议提供应用场景、执行标准、数量、尺码范围、目的市场和所需资料文件。',
      'Please provide application scenario, required standard, quantity, size range, destination market, and requested documents.',
      'Укажите сценарий применения, требуемый стандарт, количество, размерный ряд, рынок назначения и нужные документы.',
    ),
  },
];

const legacyProductDetails: Readonly<Record<string, LegacyProductDetail>> = {
  'firefighter-suit-combat': {
    model: 'HYF-5506',
    standards: ['XF10-2014'],
    materials: [
      text('三层芳纶复合结构'),
      text('芳纶外层'),
      text('PTFE 防水透气隔热层'),
      text('阻燃舒适层'),
    ],
    applications: [
      text('消防员灭火救援作业'),
      text('应急抢险'),
      text('灾害处置'),
      text('高温、火焰、热辐射及机械损伤综合防护'),
    ],
    features: [
      text('阻燃隔热'),
      text('防水透湿'),
      text('高强耐用'),
      text('导电防静电'),
      text('可提供量身定制服务'),
    ],
    description: text(
      '作战款消防员灭火防护服采用三层芳纶复合结构，面向灭火救援、应急抢险和灾害处置作业，提供阻燃隔热、防水透湿、高强耐用及防静电等综合防护。',
      'The combat-style firefighter protective suit uses a three-layer aramid composite structure for firefighting, emergency rescue, and disaster response, combining flame and heat resistance, waterproof breathability, durability, and anti-static protection.',
      'Пожарный защитный костюм боевого типа выполнен из трехслойной арамидной композитной структуры для тушения пожаров, аварийно-спасательных работ и ликвидации последствий ЧС, сочетая огне- и теплозащиту, водонепроницаемость с паропроницаемостью, прочность и антистатические свойства.',
    ),
    specifications: [
      spec('型号', 'HYF-5506', 'Model', 'Модель'),
      spec('执行标准', 'XF10-2014', 'Standard', 'Стандарт'),
      spec('颜色', '藏蓝色', 'Color', 'Цвет'),
      spec('尺码', '165A-190B', 'Size range', 'Размерный ряд'),
      spec('结构', '三层芳纶复合结构', 'Structure', 'Структура'),
      spec('主要材料', '芳纶外层、PTFE 防水透气隔热层、阻燃舒适层', 'Main materials', 'Основные материалы'),
    ],
    sellingPoints: [
      card(
        '三层复合防护',
        '芳纶外层、PTFE 防水透气隔热层与阻燃舒适层组合，覆盖灭火救援核心风险。',
        'Three-layer composite protection',
        'Aramid outer shell, PTFE waterproof breathable insulation, and flame-resistant comfort layer cover key firefighting risks.',
        'Трехслойная композитная защита',
        'Арамидный внешний слой, PTFE водонепроницаемый дышащий теплоизоляционный слой и огнестойкий комфортный слой закрывают ключевые риски пожарных работ.',
      ),
      card(
        '阻燃隔热',
        '各层具备阻燃、无熔滴和耐高温特性，可抵御火焰与热辐射侵袭。',
        'Flame and heat resistance',
        'Each layer is flame-resistant, non-melting, and heat-resistant to help resist flame and radiant heat exposure.',
        'Огнестойкость и теплоизоляция',
        'Каждый слой обладает огнестойкостью, не плавится каплями и помогает противостоять пламени и тепловому излучению.',
      ),
      card(
        '防水透湿舒适',
        'PTFE 透湿膜平衡防水拒油与透气性能，降低长时间穿着闷热感。',
        'Waterproof and breathable',
        'The PTFE membrane balances water and oil repellency with breathability for reduced heat stress during long wear.',
        'Водозащита и паропроницаемость',
        'PTFE мембрана сочетает водо- и маслоотталкивание с воздухопроницаемостью, снижая перегрев при длительном ношении.',
      ),
      card(
        '高强耐用',
        '芳纶外层高强耐磨、耐撕破，整体面料低缩水、尺寸稳定。',
        'Durable structure',
        'The aramid outer shell resists abrasion and tearing, while the fabric system keeps shrinkage low and dimensions stable.',
        'Прочная конструкция',
        'Арамидный внешний слой устойчив к истиранию и разрыву, а тканевая система сохраняет низкую усадку и стабильность размеров.',
      ),
    ],
    sizeGuide: firefighterSuitSizeGuide,
    scenarios: [
      card('灭火救援', '适用于消防员进入灭火救援现场时的综合热防护需求。', 'Firefighting and rescue', 'Designed for firefighters entering fire suppression and rescue scenes.', 'Пожаротушение и спасение', 'Для комплексной теплозащиты пожарных при тушении и спасательных работах.'),
      card('应急抢险', '用于抢险救援中高温、火焰和机械损伤并存的复杂环境。', 'Emergency response', 'Supports emergency operations where heat, flame, and mechanical hazards may coexist.', 'Аварийное реагирование', 'Для аварийных работ в условиях высокой температуры, пламени и механических рисков.'),
      card('灾害处置', '满足灾害处置场景下作业人员对热辐射与防护稳定性的要求。', 'Disaster response', 'Helps meet radiant heat and stable protection needs during disaster response.', 'Ликвидация последствий ЧС', 'Помогает обеспечить защиту от теплового излучения и стабильность защиты при ЧС.'),
    ],
    qualityEvidence: firefighterSuitEvidence,
    careInstructions: [
      text('洗涤需使用中性洗涤剂，禁止使用漂白剂、酸性洗涤剂及柔软剂。', 'Use neutral detergent. Do not use bleach, acidic detergent, or softener.', 'Используйте нейтральное моющее средство. Не применяйте отбеливатель, кислотные средства и кондиционер.'),
      text('洗涤水温不得超过 40 C。', 'Wash water temperature must not exceed 40 C.', 'Температура воды при стирке не должна превышать 40 C.'),
      text('出现磨损、烧毁等损伤，须专业修复或更换，禁用普通材料修补。', 'Worn or burned damage requires professional repair or replacement. Do not patch with ordinary materials.', 'При износе или прожогах требуется профессиональный ремонт или замена. Не используйте обычные материалы для ремонта.'),
      text('损坏无法修复的，严禁继续使用。', 'Do not continue using garments with irreparable damage.', 'Не продолжайте использовать изделие при неремонтопригодном повреждении.'),
    ],
    faqs: firefighterSuitFaqs,
  },
};

export function applyLegacyProductDetail(product: Product): Product {
  const legacyDetail = legacyProductDetails[product.id];

  return legacyDetail ? { ...product, ...legacyDetail } : product;
}

export function applyLegacyProductDetailFallback(product: Product): Product {
  const legacyDetail = legacyProductDetails[product.id];

  if (!legacyDetail) {
    return product;
  }

  const careInstructions =
    product.careInstructions && product.careInstructions.length > 0
      ? product.careInstructions
      : legacyDetail.careInstructions;
  const qualityEvidence =
    product.qualityEvidence && product.qualityEvidence.length > 0
      ? product.qualityEvidence
      : legacyDetail.qualityEvidence;
  const scenarios =
    product.scenarios && product.scenarios.length > 0 ? product.scenarios : legacyDetail.scenarios;
  const sellingPoints =
    product.sellingPoints && product.sellingPoints.length > 0
      ? product.sellingPoints
      : legacyDetail.sellingPoints;

  return {
    ...product,
    ...(localized(product.description, 'zh').trim()
      ? {}
      : { description: legacyDetail.description ?? product.description }),
    standards: product.standards.length > 0 ? product.standards : (legacyDetail.standards ?? []),
    materials:
      product.materials.length > 0 ? product.materials : (legacyDetail.materials ?? product.materials),
    applications:
      product.applications.length > 0
        ? product.applications
        : (legacyDetail.applications ?? product.applications),
    features: product.features.length > 0 ? product.features : (legacyDetail.features ?? product.features),
    specifications:
      product.specifications.length > 0
        ? product.specifications
        : (legacyDetail.specifications ?? product.specifications),
    faqs: product.faqs.length > 0 ? product.faqs : (legacyDetail.faqs ?? product.faqs),
    ...(careInstructions ? { careInstructions } : {}),
    ...(qualityEvidence ? { qualityEvidence } : {}),
    ...(scenarios ? { scenarios } : {}),
    ...(sellingPoints ? { sellingPoints } : {}),
    ...(product.sizeGuide ? {} : legacyDetail.sizeGuide ? { sizeGuide: legacyDetail.sizeGuide } : {}),
  };
}
