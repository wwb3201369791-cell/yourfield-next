import { localized, type LocalizedString } from './shared';

export type CategorySeed = {
  categoryId: string;
  group: string;
  name: LocalizedString;
  order: number;
};

export type ProductGroupSeed = {
  description: LocalizedString;
  groupId: string;
  name: LocalizedString;
  order: number;
};

export const productGroupSeeds: ProductGroupSeed[] = [
  {
    groupId: 'electrical-protection',
    name: localized('电力电弧与电磁防护', 'Electrical, Arc Flash & EM Protection', 'Электрическая, дуговая и электромагнитная защита'),
    description: localized('防电弧服、带电作业屏蔽服、高压静电服、电网工装和微波辐射防护。', 'Arc flash suits, live-line shielding suits, high-voltage anti-static clothing, grid uniforms, and microwave radiation protection.', 'Защита от дуги, экранирующая одежда, антистатическая одежда высокого напряжения, форма для электросетей и защита от СВЧ.'),
    order: 10,
  },
  {
    groupId: 'fire-rescue',
    name: localized('消防与应急救援防护', 'Fire & Emergency Rescue Protection', 'Пожарная и аварийно-спасательная защита'),
    description: localized('消防员灭火、抢险救援、森林防火、防蜂、矿山救援和综合应急防护。', 'Firefighting, rescue, wildland fire, bee protection, mine rescue, and emergency response protection.', 'Пожарная, спасательная, лесопожарная, противоосиная, горноспасательная и аварийная защита.'),
    order: 20,
  },
  {
    groupId: 'thermal-welding',
    name: localized('工业热防护与阻燃工装', 'Industrial Thermal & Flame-Resistant Workwear', 'Промышленная термо- и огнестойкая спецодежда'),
    description: localized('焊接服、阻燃防静电、熔融金属飞溅、防喷溅、耐酸碱和高可视警示服。', 'Welding clothing, flame-resistant anti-static workwear, molten metal splash protection, splash protection, acid/alkali resistance, and high-visibility apparel.', 'Сварочная, огнестойкая антистатическая одежда, защита от расплава и брызг, кислотощелочная защита и сигнальная одежда.'),
    order: 30,
  },
  {
    groupId: 'chemical-medical',
    name: localized('洁净化学与医疗防护', 'Cleanroom, Chemical & Medical Protection', 'Чистые помещения, химическая и медицинская защита'),
    description: localized('洁净服、生物制药洁净服、化学防护服、一次性防护服和卫生应急服。', 'Cleanroom garments, biopharma cleanroom clothing, chemical protective suits, disposable protection, and public health emergency clothing.', 'Одежда для чистых помещений, биофармацевтики, химическая и одноразовая защита, санитарно-аварийная одежда.'),
    order: 40,
  },
  {
    groupId: 'water-rescue',
    name: localized('水域救援防护', 'Water Rescue Protection', 'Защита для спасения на воде'),
    description: localized('水域救援服、救生衣、水域头盔、手套、靴、割绳刀和连接装备。', 'Water rescue suits, life vests, helmets, gloves, boots, rope cutters, and connection gear.', 'Костюмы, жилеты, шлемы, перчатки, ботинки, ножи и соединительное снаряжение для спасения на воде.'),
    order: 50,
  },
];

export const categorySeeds: CategorySeed[] = [
  { categoryId: 'firefighter-suit', group: 'fire-rescue', name: localized('消防员灭火防护服', 'Firefighter protective suits', 'Пожарные защитные костюмы'), order: 10 },
  { categoryId: 'rescue-suit', group: 'fire-rescue', name: localized('消防员抢险救援服', 'Firefighter rescue suits', 'Спасательные костюмы пожарных'), order: 20 },
  { categoryId: 'forest-fire', group: 'fire-rescue', name: localized('森林灭火防护装备', 'Forest firefighting suits', 'Костюмы для лесных пожаров'), order: 30 },
  { categoryId: 'arc-flash', group: 'electrical-protection', name: localized('防电弧服', 'Arc flash suits', 'Костюмы защиты от дуги'), order: 40 },
  { categoryId: 'shielding', group: 'electrical-protection', name: localized('带电作业用屏蔽服', 'Live-line shielding suits', 'Экранирующие костюмы'), order: 50 },
  { categoryId: 'high-voltage-static', group: 'electrical-protection', name: localized('交流高压静电服', 'High-voltage anti-static suits', 'Антистатические костюмы для высокого напряжения'), order: 60 },
  { categoryId: 'anti-static', group: 'electrical-protection', name: localized('防静电服', 'Anti-static clothing', 'Антистатическая одежда'), order: 70 },
  { categoryId: 'microwave-radiation', group: 'chemical-medical', name: localized('微波辐射防护服', 'Microwave radiation protection', 'Защита от СВЧ-излучения'), order: 80 },
  { categoryId: 'welding', group: 'thermal-welding', name: localized('焊接服', 'Welding protection', 'Сварочная защита'), order: 90 },
  { categoryId: 'flame-retardant', group: 'thermal-welding', name: localized('阻燃服', 'Flame-resistant clothing', 'Огнестойкая одежда'), order: 100 },
  { categoryId: 'splash-protection', group: 'thermal-welding', name: localized('防喷溅服', 'Splash protection', 'Защита от брызг'), order: 110 },
  { categoryId: 'chemical', group: 'chemical-medical', name: localized('防化服', 'Chemical protection', 'Химическая защита'), order: 120 },
  { categoryId: 'fr-anti-static', group: 'chemical-medical', name: localized('阻燃防静电服', 'FR anti-static clothing', 'Огнестойкая антистатическая одежда'), order: 130 },
  { categoryId: 'water-rescue-suit', group: 'water-rescue', name: localized('水域救援服', 'Water rescue suits', 'Костюмы для спасения на воде'), order: 140 },
  { categoryId: 'water-rescue-accessories', group: 'water-rescue', name: localized('水域救援配套装备', 'Water rescue accessories', 'Снаряжение для спасения на воде'), order: 150 },
];

export type ProductSeed = {
  categoryId: string;
  description: LocalizedString;
  imagePath: string;
  industries: string[];
  isFeatured?: boolean;
  model: string;
  name: LocalizedString;
  productId: string;
  sku?: string;
  standards: string[];
  tags: LocalizedString;
};

const productImage = 'assets/images/products/firefighter-protective-suit/modeling-jacket-front.png';

export const productSeeds: ProductSeed[] = [
  {
    productId: 'firefighter-suit-combat',
    model: 'HYF-5506',
    sku: 'HYF-5506',
    categoryId: 'firefighter-suit',
    name: localized('消防员灭火防护服（作战款）', 'Firefighter Protective Suit (Combat Style)', 'Пожарный защитный костюм (боевой тип)'),
    description: localized(
      '作战款消防员灭火防护服采用三层芳纶复合结构，面向灭火救援、应急抢险和灾害处置作业，提供阻燃隔热、防水透湿、高强耐用及防静电等综合防护。',
      'The combat-style firefighter protective suit uses a three-layer aramid composite structure for firefighting, emergency rescue, and disaster response.',
      'Пожарный защитный костюм боевого типа выполнен из трехслойной арамидной композитной структуры для тушения пожаров и спасательных работ.',
    ),
    imagePath: productImage,
    industries: ['firefighting', 'emergency-rescue'],
    isFeatured: true,
    standards: ['XF10-2014'],
    tags: localized('消防服,灭火防护服,作战款', 'firefighter suit,firefighting protection,combat style', 'пожарный костюм,защитная одежда пожарного'),
  },
  {
    productId: 'arc-flash-suit',
    model: 'ARC-FLASH',
    categoryId: 'arc-flash',
    name: localized('防电弧服', 'Arc Flash Suit', 'Костюм защиты от дуги'),
    description: localized('用于电力检修和高风险电弧作业的防护服产品。', 'Protective clothing for power maintenance and arc flash risk scenarios.', 'Защитная одежда для электромонтажных работ и риска дуговой вспышки.'),
    imagePath: productImage,
    industries: ['power'],
    standards: ['GB 8965.1-2020'],
    tags: localized('防电弧服,电力防护', 'arc flash suit,power protection', 'защита от дуги,электрозащита'),
  },
  {
    productId: 'live-line-shielding-suit',
    model: 'SHIELDING',
    categoryId: 'shielding',
    name: localized('带电作业用屏蔽服', 'Live-line Shielding Suit', 'Экранирующий костюм для работ под напряжением'),
    description: localized('用于带电作业场景的屏蔽防护服。', 'Shielding protective clothing for live-line work scenarios.', 'Экранирующая защитная одежда для работ под напряжением.'),
    imagePath: productImage,
    industries: ['power'],
    standards: ['GB/T 6568'],
    tags: localized('屏蔽服,带电作业', 'shielding suit,live-line work', 'экранирующий костюм,работы под напряжением'),
  },
  {
    productId: 'insulating-gloves',
    model: 'INSULATING-GLOVES',
    categoryId: 'high-voltage-static',
    name: localized('绝缘手套', 'Insulating Gloves', 'Изолирующие перчатки'),
    description: localized('用于电气作业防护的绝缘手套产品。', 'Insulating gloves for electrical operation protection.', 'Изолирующие перчатки для электротехнических работ.'),
    imagePath: productImage,
    industries: ['power'],
    standards: ['GB/T 17622'],
    tags: localized('绝缘手套,电气防护', 'insulating gloves,electrical protection', 'изолирующие перчатки,электрозащита'),
  },
  {
    productId: 'chemical-protective-suit',
    model: 'CHEMICAL',
    categoryId: 'chemical',
    name: localized('防化服', 'Chemical Protective Suit', 'Костюм химической защиты'),
    description: localized('用于化工、应急和污染处置场景的化学防护服。', 'Chemical protective suit for chemical, emergency, and contamination response scenarios.', 'Костюм химической защиты для химических, аварийных и загрязненных сред.'),
    imagePath: productImage,
    industries: ['petrochemical', 'emergency-rescue'],
    standards: ['GB 24539'],
    tags: localized('防化服,化学防护', 'chemical suit,chemical protection', 'химическая защита,защитный костюм'),
  },
  {
    productId: 'medical-protective-clothing',
    model: 'MEDICAL',
    categoryId: 'chemical',
    name: localized('医用防护服', 'Medical Protective Clothing', 'Медицинская защитная одежда'),
    description: localized('用于医疗和公共卫生场景的防护服产品。', 'Protective clothing for medical and public health scenarios.', 'Защитная одежда для медицинских и санитарных задач.'),
    imagePath: productImage,
    industries: ['medical'],
    standards: ['GB 19082'],
    tags: localized('医用防护服,医疗防护', 'medical protective clothing,medical protection', 'медицинская защитная одежда'),
  },
  {
    productId: 'welding-protective-clothing',
    model: 'WELDING',
    categoryId: 'welding',
    name: localized('焊接防护服', 'Welding Protective Clothing', 'Сварочная защитная одежда'),
    description: localized('用于焊接、热作业和金属加工场景的防护服。', 'Protective clothing for welding, hot work, and metal processing scenarios.', 'Защитная одежда для сварки, горячих работ и металлообработки.'),
    imagePath: productImage,
    industries: ['welding', 'steel'],
    standards: ['GB 8965.2-2022'],
    tags: localized('焊接服,热防护', 'welding clothing,thermal protection', 'сварочная одежда,теплозащита'),
  },
];
