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
    name: localized(
      '电力电弧与电磁防护',
      'Electrical, Arc Flash & EM Protection',
      'Электрическая, дуговая и электромагнитная защита',
    ),
    description: localized(
      '防电弧服、带电作业屏蔽服、高压静电服、电网工装和微波辐射防护。',
      'Arc flash suits, live-line shielding suits, high-voltage anti-static clothing, grid uniforms, and microwave radiation protection.',
      'Защита от дуги, экранирующая одежда, антистатическая одежда высокого напряжения, форма для электросетей и защита от СВЧ.',
    ),
    order: 1,
  },
  {
    groupId: 'fire-rescue',
    name: localized(
      '消防与应急救援防护',
      'Fire & Emergency Rescue Protection',
      'Пожарная и аварийно-спасательная защита',
    ),
    description: localized(
      '消防员灭火、抢险救援、森林防火、防蜂、矿山救援和综合应急防护。',
      'Firefighting, rescue, wildland fire, bee protection, mine rescue, and emergency response protection.',
      'Пожарная, спасательная, лесопожарная, противоосиная, горноспасательная и аварийная защита.',
    ),
    order: 2,
  },
  {
    groupId: 'thermal-welding',
    name: localized(
      '工业热防护与阻燃工装',
      'Industrial Thermal & Flame-Resistant Workwear',
      'Промышленная термо- и огнестойкая спецодежда',
    ),
    description: localized(
      '焊接服、阻燃防静电、熔融金属飞溅、防喷溅、耐酸碱和高可视警示服。',
      'Welding clothing, flame-resistant anti-static workwear, molten metal splash protection, splash protection, acid/alkali resistance, and high-visibility apparel.',
      'Сварочная, огнестойкая антистатическая одежда, защита от расплава и брызг, кислотощелочная защита и сигнальная одежда.',
    ),
    order: 3,
  },
  {
    groupId: 'chemical-medical',
    name: localized(
      '洁净化学与医疗防护',
      'Cleanroom, Chemical & Medical Protection',
      'Чистые помещения, химическая и медицинская защита',
    ),
    description: localized(
      '洁净服、生物制药洁净服、化学防护服、一次性防护服和卫生应急服。',
      'Cleanroom garments, biopharma cleanroom clothing, chemical protective suits, disposable protection, and public health emergency clothing.',
      'Одежда для чистых помещений, биофармацевтики, химическая и одноразовая защита, санитарно-аварийная одежда.',
    ),
    order: 4,
  },
  {
    groupId: 'water-rescue',
    name: localized('水域救援防护', 'Water Rescue Protection', 'Защита для спасения на воде'),
    description: localized(
      '水域救援服、救生衣、水域头盔、手套、靴、割绳刀和连接装备。',
      'Water rescue suits, life vests, helmets, gloves, boots, rope cutters, and connection gear.',
      'Костюмы, жилеты, шлемы, перчатки, ботинки, ножи и соединительное снаряжение для спасения на воде.',
    ),
    order: 5,
  },
];

export const categorySeeds: CategorySeed[] = [
  {
    categoryId: 'firefighter-suit',
    group: 'fire-rescue',
    name: localized(
      '消防员灭火防护服',
      'Firefighter protective suits',
      'Пожарные защитные костюмы',
    ),
    order: 1,
  },
  {
    categoryId: 'rescue-suit',
    group: 'fire-rescue',
    name: localized(
      '消防员抢险救援服',
      'Firefighter rescue suits',
      'Спасательные костюмы пожарных',
    ),
    order: 2,
  },
  {
    categoryId: 'forest-fire',
    group: 'fire-rescue',
    name: localized('森林灭火防护装备', 'Forest firefighting suits', 'Костюмы для лесных пожаров'),
    order: 3,
  },
  {
    categoryId: 'arc-flash',
    group: 'electrical-protection',
    name: localized('防电弧服', 'Arc flash suits', 'Костюмы защиты от дуги'),
    order: 4,
  },
  {
    categoryId: 'shielding',
    group: 'electrical-protection',
    name: localized('带电作业用屏蔽服', 'Live-line shielding suits', 'Экранирующие костюмы'),
    order: 5,
  },
  {
    categoryId: 'high-voltage-static',
    group: 'electrical-protection',
    name: localized(
      '交流高压静电服',
      'High-voltage anti-static suits',
      'Антистатические костюмы для высокого напряжения',
    ),
    order: 6,
  },
  {
    categoryId: 'anti-static',
    group: 'electrical-protection',
    name: localized('防静电服', 'Anti-static clothing', 'Антистатическая одежда'),
    order: 7,
  },
  {
    categoryId: 'microwave-radiation',
    group: 'chemical-medical',
    name: localized('微波辐射防护服', 'Microwave radiation protection', 'Защита от СВЧ-излучения'),
    order: 8,
  },
  {
    categoryId: 'welding',
    group: 'thermal-welding',
    name: localized('焊接服', 'Welding protection', 'Сварочная защита'),
    order: 9,
  },
  {
    categoryId: 'flame-retardant',
    group: 'thermal-welding',
    name: localized('阻燃服', 'Flame-resistant clothing', 'Огнестойкая одежда'),
    order: 10,
  },
  {
    categoryId: 'splash-protection',
    group: 'thermal-welding',
    name: localized('防喷溅服', 'Splash protection', 'Защита от брызг'),
    order: 11,
  },
  {
    categoryId: 'chemical',
    group: 'chemical-medical',
    name: localized('防化服', 'Chemical protection', 'Химическая защита'),
    order: 12,
  },
  {
    categoryId: 'fr-anti-static',
    group: 'chemical-medical',
    name: localized(
      '阻燃防静电服',
      'FR anti-static clothing',
      'Огнестойкая антистатическая одежда',
    ),
    order: 13,
  },
  {
    categoryId: 'water-rescue-suit',
    group: 'water-rescue',
    name: localized('水域救援服', 'Water rescue suits', 'Костюмы для спасения на воде'),
    order: 14,
  },
  {
    categoryId: 'water-rescue-accessories',
    group: 'water-rescue',
    name: localized(
      '水域救援配套装备',
      'Water rescue accessories',
      'Снаряжение для спасения на воде',
    ),
    order: 15,
  },
];
