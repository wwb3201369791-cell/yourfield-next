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
import { localizedPublicText, publicLocaleText } from '@/lib/product/publicText';
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

function isGenericFeatureTitle(value: string) {
  const normalized = value.trim().toLocaleLowerCase();

  return (
    /^产品特点\s*\d*$/.test(normalized) ||
    /^product\s+feature\s*\d*$/.test(normalized) ||
    /^feature\s*\d*$/.test(normalized) ||
    /^характеристика\s+продукта\s*\d*$/.test(normalized) ||
    /^особенность\s*\d*$/.test(normalized)
  );
}

function bestFeatureText(title: unknown, description: unknown, locale: Locale = 'zh') {
  const titleText = textFromUnknown(title, locale);
  const descriptionText = textFromUnknown(description, locale);

  return titleText && !isGenericFeatureTitle(titleText) ? titleText : descriptionText || titleText;
}

function localizedEntryText(value: unknown, locale: Locale): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  const record = value as Record<string, unknown>;
  const localeValue = record[locale];

  if (typeof localeValue === 'string') {
    return localeValue.trim();
  }

  if (localeValue && typeof localeValue === 'object') {
    const nestedText = textFromUnknown(localeValue, locale);
    if (nestedText) {
      return nestedText;
    }
  }

  return '';
}

function textFromUnknown(value: unknown, locale: Locale = 'zh'): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;

  const directLocalizedText = localizedEntryText(record, locale);
  if (directLocalizedText) {
    return directLocalizedText;
  }

  for (const key of ['value', 'label', 'title', 'name', 'groupId', 'slug', 'productId', 'model']) {
    const entry = record[key];
    if (typeof entry === 'string' && entry.trim()) {
      return entry.trim();
    }

    const nestedLocalizedText = localizedEntryText(entry, locale);
    if (nestedLocalizedText) {
      return nestedLocalizedText;
    }
  }

  const localizedZh = record.zh;
  if (locale === 'zh' && typeof localizedZh === 'string' && localizedZh.trim()) {
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

function arrayForLocale(value: unknown, locale: Locale = 'zh'): readonly unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const localizedValue = (value as Record<string, unknown>)[locale];
    if (Array.isArray(localizedValue)) {
      return localizedValue;
    }
  }

  return [];
}

function rowValues(value: unknown, locale: Locale = 'zh'): readonly string[] {
  return arrayForLocale(value, locale)
    .map((row) => {
      if (typeof row === 'string') {
        return row.trim();
      }
      if (row && typeof row === 'object') {
        const record = row as Record<string, unknown>;
        return textFromUnknown(record.value ?? record.label ?? record.title, locale);
      }
      return '';
    })
    .filter(Boolean);
}

function sizeGuideCellValues(value: unknown, locale: Locale = 'zh'): readonly string[] {
  return arrayForLocale(value, locale).map((row) => {
    if (typeof row === 'string') {
      return row.trim();
    }
    if (row && typeof row === 'object') {
      const record = row as Record<string, unknown>;
      return textFromUnknown(record.value ?? record.label ?? record.title, locale);
    }
    return '';
  });
}

function localizedRows(value: unknown, locale: Locale = 'zh'): readonly LocalizedText[] {
  return rowValues(value, locale).map(sameText);
}

const imageUrlPattern =
  /^(https?:|\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)([?#].*)?$/i;

function imageUrlFromText(value: string) {
  const text = normalizeEditorMediaUrl(value.trim());

  return imageUrlPattern.test(text) ? text : '';
}

function normalizeEditorMediaUrl(value: string) {
  if (
    !value ||
    value.startsWith('/') ||
    value.startsWith('data:image/') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const isLocalHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
      parsed.hostname.toLowerCase(),
    );
    const isCurrentHost =
      typeof window !== 'undefined' && parsed.hostname.toLowerCase() === window.location.hostname;

    if ((isLocalHost || isCurrentHost) && parsed.pathname.includes('/media/')) {
      const mediaPathIndex = parsed.pathname.indexOf('/media/');
      return `${parsed.pathname.slice(mediaPathIndex)}${parsed.search}${parsed.hash}`;
    }
  } catch {
    const mediaPathIndex = value.indexOf('/media/');
    if (mediaPathIndex >= 0) {
      return value.slice(mediaPathIndex);
    }
  }

  return value;
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
          thumbnailURL?: string;
          url?: string;
        };
        return imageUrlFromText(
          media.url ??
            media.sizes?.card?.url ??
            media.sizes?.thumbnail?.url ??
            media.thumbnailURL ??
            media.sizes?.feature?.url ??
            '',
        );
      }
      return '';
    })
    .filter((url): url is string => Boolean(url));
}

function detailCards(value: unknown, locale: Locale = 'zh'): readonly ProductDetailCard[] {
  return arrayForLocale(value, locale)
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        text: sameText(textFromUnknown(record.text ?? record.description, locale)),
        title: sameText(bestFeatureText(record.title, record.text ?? record.description, locale)),
      };
    })
    .filter((row) => row.title.zh);
}

function qualityEvidenceRows(
  value: unknown,
  locale: Locale = 'zh',
): readonly ProductQualityEvidence[] {
  return arrayForLocale(value, locale)
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        description: sameText(textFromUnknown(record.description, locale)),
        status: sameText(textFromUnknown(record.status, locale)),
        title: sameText(textFromUnknown(record.title, locale)),
        ...(typeof record.type === 'string' ? { type: record.type } : {}),
      };
    })
    .filter((row) => row.title.zh);
}

function specRows(value: unknown, locale: Locale = 'zh'): readonly ProductSpec[] {
  return arrayForLocale(value, locale)
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        label: sameText(textFromUnknown(record.label, locale)),
        value: sameText(textFromUnknown(record.value, locale)),
      };
    })
    .filter((row) => row.label.zh && localized(row.value, 'zh'));
}

function faqRows(value: unknown, locale: Locale = 'zh'): Product['faqs'] {
  return arrayForLocale(value, locale)
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        answer: sameText(
          textFromUnknown(record.answer ?? record.text ?? record.description, locale),
        ),
        question: sameText(textFromUnknown(record.question ?? record.title, locale)),
      };
    })
    .filter((row) => row.question.zh && row.answer.zh);
}

function sizeGuideFromValues(value: unknown, locale: Locale = 'zh'): ProductSizeGuide | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const columns = rowValues(record.columns, locale);
  const rows = Array.isArray(record.rows)
    ? record.rows
        .map((row) => {
          const rowRecord = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
          const values = sizeGuideCellValues(rowRecord.values, locale);

          return {
            label: textFromUnknown(rowRecord.label, locale),
            values,
          };
        })
        .filter((row) => row.label && row.values.some(Boolean))
    : [];

  if (!columns.length || !rows.length) {
    return undefined;
  }

  const cornerLabel = textFromUnknown(record.cornerLabel, locale);
  const title = textFromUnknown(record.title, locale);

  return {
    columns,
    rows,
    ...(cornerLabel ? { cornerLabel: sameText(cornerLabel) } : {}),
    ...(title ? { title: sameText(title) } : {}),
  };
}

function visualGroupsFromValues(
  value: unknown,
  locale: Locale = 'zh',
): readonly ProductVisualGroup[] {
  return arrayForLocale(value, locale)
    .map((row) => {
      const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        description: sameText(textFromUnknown(record.description, locale)),
        images: imageRows(record.images),
        title: sameText(textFromUnknown(record.title, locale)),
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
  const productTitle =
    localizedPublicText(product.name, locale) || (locale === 'zh' ? '' : product.id);
  const productCategory = localizedPublicText(product.categoryName, locale);
  const productDescription = localizedPublicText(product.description, locale);
  const mainProductImage = productPrimaryImage(product);
  const localizedVisualGroups = productVisualGroups(product)
    .map((group) => ({
      description: localizedPublicText(group.description, locale),
      images: group.images,
      title: localizedPublicText(group.title, locale),
      variant: group.variant,
    }))
    .filter((group) => group.title && group.images.length > 0);
  const materials = product.materials
    .map((material) => localizedPublicText(material, locale))
    .filter(Boolean);
  const applications = product.applications
    .map((application) => localizedPublicText(application, locale))
    .filter(Boolean);
  const features = product.features
    .map((feature) => localizedPublicText(feature, locale))
    .filter(Boolean);
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
      label: localizedPublicText(specification.label, locale),
      value: publicLocaleText(specValue(specification.value, locale), locale),
    }))
    .filter((specification) => specification.label && specification.value);
  const specificationRows = specifications;
  const explicitSellingPoints = (product.sellingPoints ?? [])
    .map((point) => ({
      text: localizedPublicText(point.text, locale),
      title: localizedPublicText(point.title, locale),
    }))
    .filter((point) => point.title);
  const sellingPointCards = explicitSellingPoints;
  const explicitScenarios = (product.scenarios ?? [])
    .map((scenario) => ({
      text: localizedPublicText(scenario.text, locale),
      title: localizedPublicText(scenario.title, locale),
    }))
    .filter((scenario) => scenario.title);
  const scenarioCards = explicitScenarios;
  const qualityEvidence = (product.qualityEvidence ?? [])
    .map((item) => ({
      description: localizedPublicText(item.description, locale),
      status: localizedPublicText(item.status, locale),
      title: localizedPublicText(item.title, locale),
    }))
    .filter((item) => item.title);
  const careInstructions = (product.careInstructions ?? [])
    .map((instruction) => localizedPublicText(instruction, locale))
    .filter(Boolean);
  const sizeGuide = product.sizeGuide
    ? {
        columns: product.sizeGuide.columns
          .map((column) => publicLocaleText(column, locale))
          .filter(Boolean),
        cornerLabel: product.sizeGuide.cornerLabel
          ? localizedPublicText(product.sizeGuide.cornerLabel, locale)
          : '',
        rows: product.sizeGuide.rows
          .map((row) => ({
            label: publicLocaleText(row.label, locale),
            values: row.values.map((value) => publicLocaleText(value, locale)),
          }))
          .filter((row) => row.label && row.values.some(Boolean)),
        title: product.sizeGuide.title ? localizedPublicText(product.sizeGuide.title, locale) : '',
      }
    : undefined;
  const hasSizeGuide = Boolean(
    sizeGuide && sizeGuide.columns.length > 0 && sizeGuide.rows.length > 0,
  );
  const sizeGuideTitle = sizeGuide?.title || t('product.detail.sizeGuide');
  const sizeGuideCornerLabel = sizeGuide?.cornerLabel ?? '';
  const hasIntroContent =
    Boolean(productDescription) ||
    materials.length > 0 ||
    features.length > 0 ||
    applications.length > 0;
  const faqEntries = product.faqs
    .map((faq) => ({
      answer: localizedPublicText(faq.answer, locale),
      question: localizedPublicText(faq.question, locale),
    }))
    .filter((faq) => faq.question && faq.answer);
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
      show: localizedVisualGroups.length > 0,
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
      show: faqEntries.length > 0,
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
        localizedVisualGroups.length > 0
          ? {
              carouselNextLabel: t('product.detail.carouselNext'),
              carouselPreviousLabel: t('product.detail.carouselPrevious'),
              groups: localizedVisualGroups,
              heading: t('product.detail.visualTitle'),
              locale,
              tagLabel: t('product.detail.visualTag'),
            }
          : null,
    },
  };
}

export function buildProductFromFormValues(
  values: Record<string, unknown>,
  locale: Locale = 'zh',
): Product {
  const productId =
    textFromUnknown(values.productId, locale) ||
    textFromUnknown(values.slug, locale) ||
    'draft-product';
  const categoryName = sameText(
    textFromUnknown(values.productGroup, locale) || textFromUnknown(values.category, locale),
  );
  const images = imageRows(values.images);
  const sizeGuide = sizeGuideFromValues(values.sizeGuide, locale);

  return {
    applications: localizedRows(values.applications, locale),
    careInstructions: localizedRows(values.careInstructions, locale),
    categoryId: textFromUnknown(values.category, locale) || 'draft',
    categoryName: categoryName.zh ? categoryName : emptyLocalizedText,
    description: sameText(textFromUnknown(values.description, locale)),
    faqs: faqRows(values.productFaqs, locale),
    features: Array.isArray(values.features)
      ? values.features
          .map((feature) => {
            const record =
              feature && typeof feature === 'object' ? (feature as Record<string, unknown>) : {};
            return sameText(bestFeatureText(record.title, record.description, locale));
          })
          .filter((feature) => feature.zh)
      : [],
    groupId: textFromUnknown(values.productGroup, locale) || 'draft',
    id: productId,
    image: images[0] ?? '',
    images,
    materials: localizedRows(values.materials, locale),
    model: textFromUnknown(values.model, locale) || textFromUnknown(values.sku, locale),
    name: sameText(textFromUnknown(values.name, locale)),
    qualityEvidence: qualityEvidenceRows(values.qualityEvidence, locale),
    scenarios: detailCards(values.scenarios, locale),
    sellingPoints: detailCards(values.sellingPoints, locale),
    sizeRange: rowValues(values.sizeRange, locale),
    ...(sizeGuide ? { sizeGuide } : {}),
    sku: textFromUnknown(values.sku, locale),
    specifications: specRows(values.specifications, locale),
    standards: rowValues(values.standards, locale),
    visualGroups: visualGroupsFromValues(values.visualGroups, locale),
  };
}

export function buildSectionPropsFromFormValues(
  values: Record<string, unknown>,
  locale: Locale,
  t: ProductDetailTranslator,
): ProductDetailDerivedData {
  return buildSectionPropsFromCms(buildProductFromFormValues(values, locale), locale, t);
}
