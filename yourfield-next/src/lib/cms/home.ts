import { extractedProducts } from '@/lib/content/extractedProducts';
import { buildCatalogSlots, catalogGroups } from '@/lib/content/productCatalog';
import type { Locale } from '@/lib/i18n/locale';
import {
  featuredProducts as fallbackFeaturedProducts,
  type LocalizedText,
  type Product,
} from '@/lib/mock/products';

import {
  getCmsProductCategories,
  getCmsProductGroups,
  getCmsProducts,
  getFeaturedCmsProducts,
} from './products';

const representativeProductIds = [
  { groupId: 'fire-rescue', productId: 'firefighter-suit-combat' },
  { groupId: 'electrical-protection', productId: 'arc-flash-suit' },
  { groupId: 'thermal-welding', productId: 'welding-protective-clothing' },
  { groupId: 'chemical-medical', productId: 'chemical-protective-suit' },
  { groupId: 'water-rescue', productId: 'gan-shi-shui-yu-jiu-yuan-fu' },
] as const;

const fallbackHomeProducts =
  extractedProducts.length > 0 ? extractedProducts : fallbackFeaturedProducts;

type HomeProductOverride = Readonly<
  Partial<Pick<Product, 'description' | 'features' | 'image' | 'images' | 'name' | 'standards'>>
>;

function homeText(zh: string, en = zh, ru = zh): LocalizedText {
  return { zh, en, ru };
}

const homeProductOverrides: Readonly<Record<string, HomeProductOverride>> = {
  'firefighter-suit-combat': {
    image: '/images/products/official/firefighter-suit-combat-combat-01.png',
    images: [
      '/images/products/official/firefighter-suit-combat-combat-01.png',
      '/images/products/official/firefighter-suit-combat-combat-02.png',
      '/images/products/official/firefighter-suit-combat-combat-03.png',
      '/images/products/official/firefighter-suit-combat-combat-04.png',
    ],
  },
  'arc-flash-suit': {
    name: homeText(
      '防电弧服（夹克款）',
      'Arc Flash Jacket Suit',
      'Костюм-защита от электрической дуги',
    ),
    description: homeText(
      '适用于电力电网、光伏、新能源及工业企业变电站等可能遭受电弧伤害的电气作业场景。',
      'For electrical work in power grids, photovoltaic sites, new energy facilities, and industrial substations with arc-flash risk.',
      'Для работ в электросетях, солнечной энергетике, новых энергетических объектах и промышленных подстанциях с риском электрической дуги.',
    ),
    image: '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
    features: [
      homeText(
        '适合日常巡检、配电房和低至中等电弧风险作业。',
        'Suitable for routine inspection, distribution rooms, and low-to-medium arc-risk work.',
        'Подходит для обходов, распределительных помещений и работ с низким или средним риском дуги.',
      ),
      homeText(
        '依据作业电弧能量值选择对应防护等级。',
        'Protection level should be selected according to the calculated arc energy.',
        'Уровень защиты подбирается по расчетной энергии электрической дуги.',
      ),
    ],
    standards: ['DL/T 320-2019', 'GB 8965.4-2022'],
  },
  'welding-protective-clothing': {
    image: '/images/products/official/welding-protective-clothing-class-b-split-01.png',
    images: [
      '/images/products/official/welding-protective-clothing-class-b-split-01.png',
      '/images/products/official/welding-protective-clothing-class-b-split-02.png',
      '/images/products/official/welding-protective-clothing-cooling-split-01.png',
    ],
    features: [
      homeText(
        '适用于仰焊、高空焊接和狭窄空间等高风险焊接作业。',
        'For overhead welding, work at height, confined spaces, and other high-risk welding tasks.',
        'Для потолочной сварки, работ на высоте, ограниченных пространств и других сварочных работ повышенного риска.',
      ),
      homeText(
        '本白色焊接服符合 GB 8965.2-2020 焊接服标准。',
        'This white welding suit complies with GB 8965.2-2020 welding protective clothing requirements.',
        'Белый сварочный костюм соответствует требованиям GB 8965.2-2020.',
      ),
    ],
    standards: ['GB 8965.2-2020'],
  },
  'chemical-protective-suit': {
    image: '/images/products/official/chemical-protective-suit-disposable-chemical-a-01.png',
    images: [
      '/images/products/official/chemical-protective-suit-disposable-chemical-a-01.png',
      '/images/products/official/chemical-protective-suit-disposable-chemical-a-02.png',
      '/images/products/official/chemical-protective-suit-disposable-chemical-b-01.png',
    ],
    description: homeText(
      '用于粉尘、液体喷溅和临时化学防护，适合喷漆、机械维修、农药喷洒、化工清洗等作业场景。',
      'For dust, liquid splash, and temporary chemical protection in painting, maintenance, spraying, and cleaning work.',
      'Для защиты от пыли, брызг жидкостей и временных химических рисков при окраске, ремонте, распылении и очистке.',
    ),
    features: [
      homeText(
        '高密度聚乙烯无纺布，兼顾防水透气、轻量与阻隔性能。',
        'High-density polyethylene nonwoven fabric balances water resistance, breathability, light weight, and barrier performance.',
        'Нетканый полиэтилен высокой плотности сочетает водостойкость, воздухопроницаемость, малый вес и барьерные свойства.',
      ),
      homeText(
        '连帽、弹性收口和接缝阻隔设计，减少外界液体接触。',
        'Hooded design, elastic closures, and seam barriers help reduce liquid contact.',
        'Капюшон, эластичные манжеты и барьерные швы снижают контакт с жидкостями.',
      ),
    ],
    standards: ['GB 24539-2021'],
  },
  'gan-shi-shui-yu-jiu-yuan-fu': {
    description: homeText(
      '适用于寒冷季节、低温水域、抗洪抢险和激流救援，帮助隔绝冷水污水并降低失温风险。',
      'For cold seasons, low-temperature water, flood response, and swift-water rescue, helping isolate cold or polluted water and reduce hypothermia risk.',
      'Для холодного сезона, низкотемпературной воды, паводковых и бурных водных спасательных работ, снижает контакт с холодной или загрязненной водой и риск переохлаждения.',
    ),
    features: [
      homeText(
        '干式结构配合防水拉链，适合长时间涉水救援。',
        'Dry-suit construction with waterproof zipper supports longer water-rescue operations.',
        'Сухая конструкция с водонепроницаемой молнией подходит для длительных спасательных работ в воде.',
      ),
      homeText(
        '反光识别、重点部位加固和可调节结构提升行动安全。',
        'Reflective identification, reinforced wear areas, and adjustable fit improve operational safety.',
        'Светоотражающие элементы, усиленные зоны и регулировки повышают безопасность работы.',
      ),
    ],
    standards: [],
  },
};

function applyHomeProductOverride(product: Product): Product {
  const override = homeProductOverrides[product.id];

  if (!override) {
    return product;
  }

  const image = override.image ?? product.image;
  const images =
    override.images ??
    (override.image
      ? [override.image, ...product.images.filter((item) => item && item !== override.image)]
      : product.images);

  return {
    ...product,
    ...override,
    image,
    images,
  };
}

function pickRepresentativeProducts(products: readonly Product[]) {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return representativeProductIds
    .map(({ groupId, productId }) => {
      return (
        productsById.get(productId) ??
        products.find((product) => product.groupId === groupId && product.image) ??
        products.find((product) => product.groupId === groupId) ??
        null
      );
    })
    .filter((product): product is Product => Boolean(product));
}

export async function getHomeFeaturedProducts(locale: Locale, draft = false): Promise<Product[]> {
  let products: readonly Product[];

  try {
    products = await getFeaturedCmsProducts(locale, 120, draft);
  } catch (error) {
    console.warn('[home] failed to load CMS featured products; using extracted products', {
      error,
    });
    products = fallbackHomeProducts;
  }

  const representativeProducts = pickRepresentativeProducts(products);
  const productIds = new Set(representativeProducts.map((product) => product.id));
  const representedGroups = new Set(representativeProducts.map((product) => product.groupId));
  const fallbackProducts = fallbackHomeProducts.filter((product) => !productIds.has(product.id));
  const fallbackRepresentatives = fallbackProducts.filter(
    (product) => !representedGroups.has(product.groupId),
  );

  return [...representativeProducts, ...fallbackRepresentatives]
    .slice(0, representativeProductIds.length)
    .map(applyHomeProductOverride);
}

export async function getHomeProductSearchStats(locale: Locale, draft = false) {
  try {
    const [products, groups, categories] = await Promise.all([
      getCmsProducts(locale, draft),
      getCmsProductGroups(locale),
      getCmsProductCategories(locale),
    ]);
    const useCmsCatalog = groups.length > 0 && categories.length > 0;

    return {
      catalogCount: useCmsCatalog ? products.length : buildCatalogSlots(products).length,
      groupCount: useCmsCatalog ? groups.length : catalogGroups.length,
    };
  } catch (error) {
    console.warn('[home] failed to load CMS product stats; using fallback catalog stats', {
      error,
    });

    return {
      catalogCount: buildCatalogSlots(fallbackHomeProducts).length,
      groupCount: catalogGroups.length,
    };
  }
}
