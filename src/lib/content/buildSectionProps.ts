import type {
  CareProps,
  FaqProps,
  HeroSectionProps,
  IntroSectionProps,
  QualityEvidenceProps,
  ScenariosProps,
  SellingPointsProps,
  SidebarNavProps,
  SizeGuideTableProps,
  SpecTableProps,
  VisualGroupsProps,
} from '@/components/product-detail/sections';
import { buildProductDetailFacts } from '@/lib/content/productDetail';
import { buildProductDetailNavItems } from '@/lib/content/productDetailNav';
import { productPrimaryImage, productVisualGroups } from '@/lib/content/productVisuals';
import type { Locale } from '@/lib/i18n/locale';
import {
  localized,
  specValue,
  type LocalizedText,
  type Product,
  type ProductDetailCard,
  type ProductQualityEvidence,
  type ProductSizeGuide,
  type ProductSpec,
  type ProductVisualGroup,
} from '@/lib/product/types';

export type ProductDetailTranslator = (key: string) => string;

export type ProductDetailSectionProps = Readonly<{
  care: CareProps | null;
  faq: FaqProps | null;
  hero: HeroSectionProps;
  intro: IntroSectionProps | null;
  qualityEvidence: QualityEvidenceProps | null;
  scenarios: ScenariosProps | null;
  sellingPoints: SellingPointsProps | null;
  sidebar: SidebarNavProps | null;
  sizeGuide: SizeGuideTableProps | null;
  specifications: SpecTableProps | null;
  visualGroups: VisualGroupsProps | null;
}>;

export type ProductDetailDerivedData = Readonly<{
  facts: HeroSectionProps['facts'];
  faqEntries: FaqProps['entries'];
  mainProductImage: string;
  productCategory: string;
  productDescription: string;
  productTitle: string;
  sections: ProductDetailSectionProps;
}>;

const emptyLocalizedText: LocalizedText = {
  zh: '',
  en: '',
  ru: '',
};

function sameText(value: unknown): LocalizedText {
  const text = typeof value === 'string' ? value : '';
  return {
    zh: text,
    en: text,
    ru: text,
  };
}

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  for (const key of ['value', 'label', 'title', 'name', 'groupId', 'slug', 'productId', 'model']) {
    const entry = record[key];
    if (typeof entry === 'string' && entry.trim()) {
      return entry.trim();
    }
  }

  const localizedZh = record.zh;
  if (typeof localizedZh === 'string' && localizedZh.trim()) {
    return localizedZh.trim();
  }

  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    const record = node as Record<string, unknown>;
    if (typeof record.text === 'string') {
      parts.push(record.text);
    }
    if (Array.isArray(record.children)) {
      record.children.forEach(walk);
    }
    if (record.root) {
      walk(record.root);
    }
  };

  walk(value);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function rowValues(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      if (typeof row === 'string') {
        return row.trim();
      }
      if (row && typeof row === 'object') {
        const record = row as Record<string, unknown>;
        return textFromUnknown(record.value ?? record.label ?? record.title);
      }
      return '';
    })
    .filter(Boolean);
}

function sizeGuideCellValues(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((row) => {
    if (typeof row === 'string') {
      return row.trim();
    }
    if (row && typeof row === 'object') {
      const record = row as Record<string, unknown>;
      return textFromUnknown(record.value ?? record.label ?? record.title);
    }
    return '';
  });
}

function localizedRows(value: unknown): readonly LocalizedText[] {
  return rowValues(value).map(sameText);
}

const imageUrlPattern =
  /^(https?:|\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)([?#].*)?$/i;

function imageUrlFromText(value: string) {
  const text = value.trim();

  return imageUrlPattern.test(text) ? text : '';
}

function imageRows(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      if (typeof row === 'string') {
        return imageUrlFromText(row);
      }
      if (!row || typeof row !== 'object') {
        return '';
      }
      const record = row as Record<string, unknown>;
      const file = record.file;
      if (typeof file === 'string') {
        return imageUrlFromText(file);
      }
      if (file && typeof file === 'object') {
        const media = file as {
          sizes?: Record<string, { url?: string } | undefined>;
          url?: string;
        };
        return media.sizes?.card?.url ?? media.url ?? '';
      }
      return '';
    })
    .filter((url): url is string => Boolean(url));
}

function detailCards(value: unknown): readonly ProductDetailCard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        text: sameText(record.text ?? record.description),
        title: sameText(record.title),
      };
    })
    .filter((row) => row.title.zh);
}

function qualityEvidenceRows(value: unknown): readonly ProductQualityEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        description: sameText(record.description),
        status: sameText(record.status),
        title: sameText(record.title),
        ...(typeof record.type === 'string' ? { type: record.type } : {}),
      };
    })
    .filter((row) => row.title.zh);
}

function specRows(value: unknown): readonly ProductSpec[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        label: sameText(record.label),
        value: sameText(record.value),
      };
    })
    .filter((row) => row.label.zh && localized(row.value, 'zh'));
}

function faqRows(value: unknown): Product['faqs'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        answer: sameText(record.answer ?? record.text ?? record.description),
        question: sameText(record.question ?? record.title),
      };
    })
    .filter((row) => row.question.zh && row.answer.zh);
}

function sizeGuideFromValues(value: unknown): ProductSizeGuide | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const columns = rowValues(record.columns);
  const rows = Array.isArray(record.rows)
    ? record.rows
        .map((row) => {
          const rowRecord = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
          const values = sizeGuideCellValues(rowRecord.values);

          return {
            label: textFromUnknown(rowRecord.label),
            values,
          };
        })
        .filter((row) => row.label && row.values.some(Boolean))
    : [];

  if (!columns.length || !rows.length) {
    return undefined;
  }

  return {
    columns,
    rows,
    ...(textFromUnknown(record.cornerLabel) ? { cornerLabel: sameText(record.cornerLabel) } : {}),
    ...(textFromUnknown(record.title) ? { title: sameText(record.title) } : {}),
  };
}

function visualGroupsFromValues(value: unknown): readonly ProductVisualGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        description: sameText(record.description),
        images: imageRows(record.images),
        title: sameText(record.title),
        variant: typeof record.variant === 'string' ? record.variant : 'gallery',
      };
    })
    .filter((group) => group.title.zh && group.images.length > 0);
}

export function buildSectionPropsFromCms(
  product: Product,
  locale: Locale,
  t: ProductDetailTranslator,
): ProductDetailDerivedData {
  const productTitle = localized(product.name, locale);
  const productCategory = localized(product.categoryName, locale);
  const productDescription = localized(product.description, locale);
  const mainProductImage = productPrimaryImage(product);
  const visualGroups = productVisualGroups(product);
  const materials = product.materials
    .map((material) => localized(material, locale))
    .filter(Boolean);
  const applications = product.applications
    .map((application) => localized(application, locale))
    .filter(Boolean);
  const features = product.features.map((feature) => localized(feature, locale)).filter(Boolean);
  const { facts } = buildProductDetailFacts(product, locale, {
    category: t('product.detail.category'),
    color: t('product.detail.color'),
    materials: t('product.detail.materials'),
    model: t('product.detail.model'),
    sizeRange: t('product.detail.sizeRange'),
    standard: t('product.detail.standard'),
    structure: t('product.detail.structure'),
  });
  const specifications = product.specifications
    .map((specification) => ({
      label: localized(specification.label, locale).trim(),
      value: specValue(specification.value, locale).trim(),
    }))
    .filter((specification) => specification.label && specification.value);
  const specificationRows = specifications.length > 0 ? specifications : facts;
  const explicitSellingPoints = (product.sellingPoints ?? [])
    .map((point) => ({
      text: localized(point.text, locale).trim(),
      title: localized(point.title, locale).trim(),
    }))
    .filter((point) => point.title);
  const sellingPointCards =
    explicitSellingPoints.length > 0
      ? explicitSellingPoints
      : features.slice(0, 4).map((feature) => ({ text: '', title: feature }));
  const explicitScenarios = (product.scenarios ?? [])
    .map((scenario) => ({
      text: localized(scenario.text, locale).trim(),
      title: localized(scenario.title, locale).trim(),
    }))
    .filter((scenario) => scenario.title);
  const scenarioCards =
    explicitScenarios.length > 0
      ? explicitScenarios
      : applications.map((application) => ({ text: '', title: application }));
  const qualityEvidence = (product.qualityEvidence ?? [])
    .map((item) => ({
      description: localized(item.description, locale).trim(),
      status: localized(item.status, locale).trim(),
      title: localized(item.title, locale).trim(),
    }))
    .filter((item) => item.title);
  const careInstructions = (product.careInstructions ?? [])
    .map((instruction) => localized(instruction, locale).trim())
    .filter(Boolean);
  const sizeGuide = product.sizeGuide;
  const hasSizeGuide = Boolean(
    sizeGuide && sizeGuide.columns.length > 0 && sizeGuide.rows.length > 0,
  );
  const sizeGuideTitle = sizeGuide?.title
    ? localized(sizeGuide.title, locale)
    : t('product.detail.sizeGuide');
  const sizeGuideCornerLabel = sizeGuide?.cornerLabel
    ? localized(sizeGuide.cornerLabel, locale)
    : '';
  const hasIntroContent =
    Boolean(productDescription) ||
    materials.length > 0 ||
    features.length > 0 ||
    applications.length > 0;
  const faqEntries = product.faqs.map((faq) => ({
    answer: localized(faq.answer, locale),
    question: localized(faq.question, locale),
  }));
  const detailNavItems = buildProductDetailNavItems([
    {
      id: 'product-intro',
      label: t('product.detail.productIntro'),
      show: hasIntroContent,
    },
    {
      id: 'selling-points',
      label: t('product.detail.sellingPoints'),
      show: sellingPointCards.length > 0,
    },
    {
      id: 'specifications',
      label: t('product.detail.specifications'),
      show: specificationRows.length > 0,
    },
    {
      id: 'size-guide',
      label: sizeGuideTitle,
      show: hasSizeGuide,
    },
    {
      id: 'application-scenarios',
      label: t('product.detail.applications'),
      show: scenarioCards.length > 0,
    },
    {
      id: 'visual-gallery',
      label: t('product.detail.visualTitle'),
      show: visualGroups.length > 0,
    },
    {
      id: 'quality-evidence',
      label: t('product.detail.evidenceTitle'),
      show: qualityEvidence.length > 0,
    },
    {
      id: 'care-instructions',
      label: t('product.detail.care'),
      show: careInstructions.length > 0,
    },
    {
      id: 'faq',
      label: t('product.detail.faq'),
      show: product.faqs.length > 0,
    },
  ]);

  return {
    facts,
    faqEntries,
    mainProductImage,
    productCategory,
    productDescription,
    productTitle,
    sections: {
      care:
        careInstructions.length > 0
          ? {
              heading: t('product.detail.care'),
              instructions: careInstructions,
              locale,
              tagLabel: t('product.detail.careTag'),
            }
          : null,
      faq:
        faqEntries.length > 0
          ? {
              entries: faqEntries,
              heading: t('product.detail.faq'),
              locale,
              tagLabel: t('product.detail.faqTag'),
            }
          : null,
      hero: {
        ctaAllProductsLabel: t('common.viewAllProducts'),
        ctaQuoteLabel: t('common.requestQuote'),
        facts,
        galleryLabel: t('product.detail.gallery'),
        locale,
        mainImage: mainProductImage,
        productCategory,
        productCategoryFallbackLabel: t('page.products.title'),
        productDescription,
        productId: product.id,
        productTitle,
        thumbnails: [],
      },
      intro: hasIntroContent
        ? {
            applications,
            applicationsLabel: t('product.detail.applications'),
            description: productDescription,
            features,
            featuresLabel: t('product.detail.features'),
            heading: t('product.detail.productIntro'),
            locale,
            materials,
            materialsLabel: t('product.detail.materials'),
            overviewLabel: t('product.detail.overview'),
            tagLabel: t('product.detail.introTag'),
          }
        : null,
      qualityEvidence:
        qualityEvidence.length > 0
          ? {
              heading: t('product.detail.evidenceTitle'),
              items: qualityEvidence,
              locale,
              tagLabel: t('product.detail.evidenceTag'),
            }
          : null,
      scenarios:
        scenarioCards.length > 0
          ? {
              heading: t('product.detail.applications'),
              locale,
              scenarios: scenarioCards,
              tagLabel: t('product.detail.scenarioTag'),
            }
          : null,
      sellingPoints:
        sellingPointCards.length > 0
          ? {
              heading: t('product.detail.sellingPoints'),
              locale,
              points: sellingPointCards,
              tagLabel: t('product.detail.sellingPointsTag'),
            }
          : null,
      sidebar:
        detailNavItems.length > 0
          ? {
              items: detailNavItems,
              navTitle: t('product.detail.navTitle'),
            }
          : null,
      sizeGuide:
        hasSizeGuide && sizeGuide
          ? {
              columns: sizeGuide.columns,
              cornerLabel: sizeGuideCornerLabel,
              heading: sizeGuideTitle,
              locale,
              rows: sizeGuide.rows,
              tagLabel: t('product.detail.sizeGuideTag'),
            }
          : null,
      specifications:
        specificationRows.length > 0
          ? {
              heading: t('product.detail.specifications'),
              locale,
              rows: specificationRows,
              tagLabel: t('product.detail.specTag'),
            }
          : null,
      visualGroups:
        visualGroups.length > 0
          ? {
              carouselNextLabel: t('product.detail.carouselNext'),
              carouselPreviousLabel: t('product.detail.carouselPrevious'),
              groups: visualGroups.map((group) => ({
                description: localized(group.description, locale),
                images: group.images,
                title: localized(group.title, locale),
                variant: group.variant,
              })),
              heading: t('product.detail.visualTitle'),
              locale,
              tagLabel: t('product.detail.visualTag'),
            }
          : null,
    },
  };
}

export function buildProductFromFormValues(values: Record<string, unknown>): Product {
  const productId =
    textFromUnknown(values.productId) || textFromUnknown(values.slug) || 'draft-product';
  const categoryName = sameText(
    textFromUnknown(values.productGroup) || textFromUnknown(values.category),
  );
  const images = imageRows(values.images);
  const sizeGuide = sizeGuideFromValues(values.sizeGuide);

  return {
    applications: localizedRows(values.applications),
    careInstructions: localizedRows(values.careInstructions),
    categoryId: textFromUnknown(values.category) || 'draft',
    categoryName: categoryName.zh ? categoryName : emptyLocalizedText,
    description: sameText(textFromUnknown(values.description)),
    faqs: faqRows(values.productFaqs),
    features: Array.isArray(values.features)
      ? values.features
          .map((feature) => {
            const record =
              feature && typeof feature === 'object' ? (feature as Record<string, unknown>) : {};
            return sameText(record.title ?? record.description);
          })
          .filter((feature) => feature.zh)
      : [],
    groupId: textFromUnknown(values.productGroup) || 'draft',
    id: productId,
    image: images[0] ?? '',
    images,
    materials: localizedRows(values.materials),
    model: textFromUnknown(values.model) || textFromUnknown(values.sku),
    name: sameText(textFromUnknown(values.name)),
    qualityEvidence: qualityEvidenceRows(values.qualityEvidence),
    scenarios: detailCards(values.scenarios),
    sellingPoints: detailCards(values.sellingPoints),
    sizeRange: rowValues(values.sizeRange),
    ...(sizeGuide ? { sizeGuide } : {}),
    sku: textFromUnknown(values.sku),
    specifications: specRows(values.specifications),
    standards: rowValues(values.standards),
    visualGroups: visualGroupsFromValues(values.visualGroups),
  };
}

export function buildSectionPropsFromFormValues(
  values: Record<string, unknown>,
  locale: Locale,
  t: ProductDetailTranslator,
): ProductDetailDerivedData {
  return buildSectionPropsFromCms(buildProductFromFormValues(values), locale, t);
}
