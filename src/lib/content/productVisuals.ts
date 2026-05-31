import type { LocalizedText, ProductVisualGroup } from '@/lib/product/types';

type ProductImageSource = Readonly<{
  id: string;
  image?: string;
  images?: readonly string[];
  visualGroups?: readonly ProductVisualGroup[];
}>;

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
  return cleanVisualGroups(product.visualGroups);
}
