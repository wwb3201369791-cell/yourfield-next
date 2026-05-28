import type { LocalizedText, ProductVisualGroup } from '@/lib/mock/products';

type ProductImageSource = Readonly<{
  id: string;
  image?: string;
  images?: readonly string[];
  visualGroups?: readonly ProductVisualGroup[];
}>;

const defaultGalleryTitle: LocalizedText = {
  zh: '产品图册',
  en: 'Product gallery',
  ru: 'Галерея продукта',
};

const defaultGalleryDescription: LocalizedText = {
  zh: '展示该商品资料中提取并高清优化后的对应图片。',
  en: 'Shows the matching images extracted from the product materials and optimized in high resolution.',
  ru: 'Показывает соответствующие изображения из материалов продукта после HD-оптимизации.',
};

const firefighterSuitTemplate: {
  primaryImage: string;
  visualGroups: readonly ProductVisualGroup[];
} = {
  primaryImage: '/images/products/firefighter-protective-suit/modeling-jacket-front.png',
  visualGroups: [
    {
      variant: 'scene',
      title: {
        zh: '场景图',
        en: 'Application scenes',
        ru: 'Сценарии применения',
      },
      description: {
        zh: '展示灭火救援、应急抢险与灾害处置等应用环境。',
        en: 'Shows firefighting, emergency rescue, and disaster response environments.',
        ru: 'Показывает условия пожаротушения, спасательных работ и ликвидации ЧС.',
      },
      images: [
        '/images/products/firefighter-protective-suit/scene-01.jpg',
        '/images/products/firefighter-protective-suit/scene-02.jpg',
      ],
    },
    {
      variant: 'modeling',
      title: {
        zh: '建模图',
        en: 'Product modeling views',
        ru: 'Модельные виды изделия',
      },
      description: {
        zh: '展示作战款上衣与裤装的正面、背面及左右侧视图。',
        en: 'Shows front, rear, left, and right views of the combat-style jacket and trousers.',
        ru: 'Показывает куртку и брюки боевого типа спереди, сзади, слева и справа.',
      },
      images: [
        '/images/products/firefighter-protective-suit/modeling-jacket-front.png',
        '/images/products/firefighter-protective-suit/modeling-jacket-back.png',
        '/images/products/firefighter-protective-suit/modeling-jacket-left.png',
        '/images/products/firefighter-protective-suit/modeling-jacket-right.png',
        '/images/products/firefighter-protective-suit/modeling-pants-front.png',
        '/images/products/firefighter-protective-suit/modeling-pants-back.png',
        '/images/products/firefighter-protective-suit/modeling-pants-left.png',
        '/images/products/firefighter-protective-suit/modeling-pants-right.png',
      ],
    },
    {
      variant: 'model',
      title: {
        zh: '模特上身图',
        en: 'Model wearing views',
        ru: 'Виды на модели',
      },
      description: {
        zh: '展示作战款消防员灭火防护服正面与背面穿着效果。',
        en: 'Shows the front and rear wearing effect of the combat-style firefighter protective suit.',
        ru: 'Показывает вид спереди и сзади пожарного защитного костюма боевого типа на модели.',
      },
      images: [
        '/images/products/firefighter-protective-suit/model-front.png',
        '/images/products/firefighter-protective-suit/model-back.png',
      ],
    },
  ],
};

const productTemplates: Record<
  string,
  {
    primaryImage?: string;
    visualGroups: readonly ProductVisualGroup[];
  }
> = {
  'firefighter-suit-combat': firefighterSuitTemplate,
};

function cleanImages(images: readonly string[]) {
  return images.map((image) => image.trim()).filter(Boolean);
}

function uniqueImages(images: readonly string[]) {
  return cleanImages(images).filter((image, index, values) => values.indexOf(image) === index);
}

function cleanLocalizedText(value: LocalizedText) {
  return value.zh.trim();
}

function cleanVariant(value: string) {
  const variant = value.trim();

  return /^[a-z0-9-]+$/.test(variant) ? variant : 'gallery';
}

function cleanVisualGroups(groups: readonly ProductVisualGroup[] | undefined) {
  return (groups ?? [])
    .map((group) => ({
      ...group,
      images: uniqueImages(group.images),
      variant: cleanVariant(group.variant),
    }))
    .filter((group) => group.images.length > 0 && cleanLocalizedText(group.title));
}

export function productPrimaryImage(product: ProductImageSource) {
  return (
    productTemplates[product.id]?.primaryImage ??
    product.image ??
    product.images?.find(Boolean) ??
    ''
  );
}

export function productVisualGroups(product: ProductImageSource) {
  const cmsGroups = cleanVisualGroups(product.visualGroups);

  if (cmsGroups.length > 0) {
    return cmsGroups;
  }

  const templateGroups = cleanVisualGroups(productTemplates[product.id]?.visualGroups);

  if (templateGroups.length > 0) {
    return templateGroups;
  }

  const galleryImages = uniqueImages([product.image ?? '', ...(product.images ?? [])]);

  if (galleryImages.length === 0) {
    return [];
  }

  return [
    {
      description: defaultGalleryDescription,
      images: galleryImages,
      title: defaultGalleryTitle,
      variant: 'gallery',
    },
  ] satisfies ProductVisualGroup[];
}
