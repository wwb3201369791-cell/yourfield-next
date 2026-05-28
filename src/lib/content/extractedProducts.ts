import type { Product, ProductFaq, ProductSpec } from '@/lib/mock/products';

import extractedProductPayload from './extracted-products.generated.json';
import { applyLegacyProductDetail } from './productLegacyDetails';

type ExtractedRawSpec = Readonly<{
  label: string;
  value: string;
}>;

type ExtractedRawProduct = Readonly<{
  applications: readonly string[];
  categoryId: string;
  categoryName: string;
  description: string;
  features: readonly string[];
  groupId: string;
  id: string;
  image: string;
  images: readonly string[];
  materials: readonly string[];
  model: string;
  name: string;
  sku?: string;
  specifications: readonly ExtractedRawSpec[];
  standards: readonly string[];
}>;

type ExtractedProductPayload = Readonly<{
  products: readonly ExtractedRawProduct[];
}>;

function localizedText(value: string) {
  return {
    zh: value,
    en: value,
    ru: value,
  };
}

function localizedSpec(spec: ExtractedRawSpec): ProductSpec {
  return {
    label: localizedText(spec.label),
    value: localizedText(spec.value),
  };
}

function mapExtractedProduct(product: ExtractedRawProduct): Product {
  return {
    id: product.id,
    model: product.model,
    ...(product.sku ? { sku: product.sku } : {}),
    categoryId: product.categoryId,
    categoryName: localizedText(product.categoryName),
    groupId: product.groupId,
    name: localizedText(product.name),
    description: localizedText(product.description || product.name),
    image: product.image,
    images: product.images,
    standards: product.standards,
    materials: product.materials.map(localizedText),
    applications: product.applications.map(localizedText),
    features: product.features.map(localizedText),
    specifications: product.specifications.map(localizedSpec),
    faqs: [] satisfies ProductFaq[],
  };
}

const payload = extractedProductPayload as ExtractedProductPayload;

export const extractedProducts: readonly Product[] = payload.products.map((product) =>
  applyLegacyProductDetail(mapExtractedProduct(product)),
);

export function getExtractedProductById(id: string) {
  return extractedProducts.find((product) => product.id === id) ?? null;
}

export function hasVisibleProductImage(product: Product) {
  return Boolean(product.image || product.images.some(Boolean));
}
