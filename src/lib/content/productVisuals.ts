import type { LocalizedText, ProductVisualGroup } from '@/lib/product/types';

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
  zh: '展示后台维护的产品图片。',
  en: 'Shows product images maintained in the admin.',
  ru: 'Показывает изображения продукта из панели управления.',
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
  return product.image ?? product.images?.find(Boolean) ?? '';
}

export function productVisualGroups(product: ProductImageSource) {
  const cmsGroups = cleanVisualGroups(product.visualGroups);

  if (cmsGroups.length > 0) {
    return cmsGroups;
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
