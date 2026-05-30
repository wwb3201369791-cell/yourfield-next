import type { Locale } from '@/lib/i18n/locale';

export type SectionLocale = Locale;

export type BaseSectionProps = Readonly<{
  locale: SectionLocale;
}>;

export type DetailFact = Readonly<{
  label: string;
  value: string;
}>;

export type HeroSectionProps = BaseSectionProps &
  Readonly<{
    ctaAllProductsLabel: string;
    ctaQuoteLabel: string;
    facts: readonly DetailFact[];
    galleryLabel?: string;
    mainImage: string | null;
    productCategory: string;
    productCategoryFallbackLabel?: string;
    productDescription: string;
    productId: string;
    productTitle: string;
    thumbnails: readonly string[];
  }>;

export type IntroSectionProps = BaseSectionProps &
  Readonly<{
    applications: readonly string[];
    applicationsLabel: string;
    description: string;
    features: readonly string[];
    featuresLabel: string;
    heading: string;
    materials: readonly string[];
    materialsLabel: string;
    overviewLabel: string;
    tagLabel: string;
  }>;

export type SellingPointCard = Readonly<{
  text: string;
  title: string;
}>;

export type SellingPointsProps = BaseSectionProps &
  Readonly<{
    heading: string;
    points: readonly SellingPointCard[];
    tagLabel: string;
  }>;

export type SpecRow = Readonly<{
  label: string;
  value: string;
}>;

export type SpecTableProps = BaseSectionProps &
  Readonly<{
    heading: string;
    rows: readonly SpecRow[];
    tagLabel: string;
  }>;

export type SizeGuideRow = Readonly<{
  label: string;
  values: readonly string[];
}>;

export type SizeGuideTableProps = BaseSectionProps &
  Readonly<{
    columns: readonly string[];
    cornerLabel: string;
    heading: string;
    rows: readonly SizeGuideRow[];
    tagLabel: string;
  }>;

export type ScenarioCard = Readonly<{
  text: string;
  title: string;
}>;

export type ScenariosProps = BaseSectionProps &
  Readonly<{
    heading: string;
    scenarios: readonly ScenarioCard[];
    tagLabel: string;
  }>;

export type VisualGroup = Readonly<{
  description: string;
  images: readonly string[];
  title: string;
  variant: string;
}>;

export type VisualGroupsProps = BaseSectionProps &
  Readonly<{
    carouselNextLabel: string;
    carouselPreviousLabel: string;
    groups: readonly VisualGroup[];
    heading: string;
    tagLabel: string;
  }>;

export type EvidenceCard = Readonly<{
  description: string;
  status: string;
  title: string;
}>;

export type QualityEvidenceProps = BaseSectionProps &
  Readonly<{
    heading: string;
    items: readonly EvidenceCard[];
    tagLabel: string;
  }>;

export type CareProps = BaseSectionProps &
  Readonly<{
    heading: string;
    instructions: readonly string[];
    tagLabel: string;
  }>;

export type FaqEntry = Readonly<{
  answer: string;
  question: string;
}>;

export type FaqProps = BaseSectionProps &
  Readonly<{
    entries: readonly FaqEntry[];
    heading: string;
    tagLabel: string;
  }>;

export type SidebarItem = Readonly<{
  id: string;
  label: string;
}>;

export type SidebarNavProps = Readonly<{
  items: readonly SidebarItem[];
  navTitle: string;
}>;

export type ProductSectionProps =
  | HeroSectionProps
  | IntroSectionProps
  | SellingPointsProps
  | SpecTableProps
  | SizeGuideTableProps
  | ScenariosProps
  | VisualGroupsProps
  | QualityEvidenceProps
  | CareProps
  | FaqProps;
