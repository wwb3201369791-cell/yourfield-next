import type { Product, ProductGroupId } from '@/lib/mock/products';

export type TextRow = {
  value?: string;
};

export type CmsProductGroupDoc = {
  description?: string;
  groupId?: string;
  name?: string;
  order?: number;
  showOnFrontend?: boolean;
};

export type CmsCategory = {
  categoryId?: string;
  description?: string;
  group?: string;
  name?: string;
  order?: number;
  productGroup?: CmsProductGroupDoc | number | string;
};

export type CmsUpload = {
  alt?: string;
  sizes?: Record<string, { url?: string } | undefined>;
  url?: string;
};

export type CmsProductImage = {
  file?: CmsUpload | number | string;
};

export type CmsProductVisualGroup = {
  description?: string;
  images?: CmsProductImage[];
  title?: string;
  variant?: string;
};

export type CmsProductFeature = {
  description?: string;
  title?: string;
};

export type CmsProductSizeGuide = {
  columns?: Array<{ label?: string }>;
  cornerLabel?: string;
  rows?: Array<{
    label?: string;
    values?: Array<{ value?: string }>;
  }>;
  title?: string;
};

export type CmsProductQualityEvidence = {
  description?: string;
  status?: string;
  title?: string;
  type?: string;
};

export type CmsProductScenario = {
  description?: string;
  title?: string;
};

export type CmsProductSellingPoint = {
  text?: string;
  title?: string;
};

export type CmsProductSpecification = {
  label?: string;
  value?: string;
};

export type CmsFaq = {
  answer?: unknown;
  question?: string;
};

export type CmsProductFaq = {
  answer?: string;
  question?: string;
};

export type CmsProduct = {
  applications?: TextRow[];
  careInstructions?: TextRow[];
  category?: CmsCategory | number | string;
  description?: unknown;
  displayOrder?: number;
  features?: CmsProductFeature[];
  id?: number | string;
  images?: CmsProductImage[];
  isFeatured?: boolean;
  materials?: TextRow[];
  model?: string;
  name?: string;
  productGroup?: CmsProductGroupDoc | number | string;
  productId?: string;
  qualityEvidence?: CmsProductQualityEvidence[];
  scenarios?: CmsProductScenario[];
  sellingPoints?: CmsProductSellingPoint[];
  sizeRange?: TextRow[];
  sizeGuide?: CmsProductSizeGuide;
  sku?: string;
  slug?: string;
  faqs?: Array<CmsFaq | number | string>;
  productFaqs?: CmsProductFaq[];
  specifications?: CmsProductSpecification[];
  standards?: TextRow[];
  visualGroups?: CmsProductVisualGroup[];
};

export type CmsProductGroup = Readonly<{
  categoryIds: readonly string[];
  id: ProductGroupId;
  order: number;
  title: string;
  description?: string;
}>;

export type CmsProductCategory = Readonly<{
  description: string;
  groupId: ProductGroupId;
  id: string;
  order: number;
  title: string;
}>;

export type MappedCmsProduct = Product & {
  productId?: string;
  slug?: string;
};
