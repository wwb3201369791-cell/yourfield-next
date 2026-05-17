import type { Locale } from '@/lib/i18n/locale';
import type { NewsItem } from '@/lib/mock/news';
import { localized, specValue, type Product, type ProductFaq } from '@/lib/mock/products';
import { absoluteUrl, localizedPath, siteName } from '@/lib/seo/buildMetadata';

export type BreadcrumbItem = Readonly<{
  name: string;
  path: string;
}>;

export function organizationJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName(locale),
    url: absoluteUrl(localizedPath(locale, '/')),
    logo: absoluteUrl('/images/brand/yourfield-logo-official-b.png'),
    foundingDate: '2002',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CN',
      addressRegion: 'Hunan',
      addressLocality: 'Xiangtan',
      streetAddress:
        locale === 'zh'
          ? '湖南省湘潭市高新区创业东路1号湖湘防护科创园'
          : 'No. 1 Chuangye East Road, Xiangtan High-Tech Zone, Hunan, China',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+86-400-680-0181',
      email: 'hnyf@yourfield.net',
      contactType: 'customer service',
      areaServed: ['CN', 'US', 'RU'],
    },
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName(locale),
    url: absoluteUrl(localizedPath(locale, '/')),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(localizedPath(locale, '/search'))}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collectionPageJsonLd(
  name: string,
  description: string,
  path: string,
  hasPart: readonly BreadcrumbItem[] = [],
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
  };

  if (hasPart.length > 0) {
    data.hasPart = hasPart.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: absoluteUrl(item.path),
    }));
  }

  return data;
}

export function productJsonLd(product: Product, locale: Locale) {
  const path = localizedPath(locale, `/products/${product.id}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localized(product.name, locale),
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    sku: product.sku || product.model,
    model: product.model,
    brand: {
      '@type': 'Brand',
      name: siteName(locale),
    },
    category: localized(product.categoryName, locale),
    description: localized(product.description, locale),
    image: product.images.map((image) => absoluteUrl(image)),
    additionalProperty: product.specifications.map((item) => ({
      '@type': 'PropertyValue',
      name: localized(item.label, locale),
      value: specValue(item.value, locale),
    })),
  };
}

export function faqPageJsonLd(faqs: readonly ProductFaq[], locale: Locale, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: absoluteUrl(path),
    inLanguage: locale,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: localized(faq.question, locale),
      acceptedAnswer: {
        '@type': 'Answer',
        text: localized(faq.answer, locale),
      },
    })),
  };
}

export function newsArticleJsonLd(
  item: NewsItem,
  locale: Locale,
  title: string,
  description: string,
) {
  const path = localizedPath(locale, `/news/${item.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: locale,
    datePublished: item.datePublished,
    dateModified: item.dateModified ?? item.datePublished,
    image: [absoluteUrl(item.image)],
    author: {
      '@type': 'Organization',
      name: siteName(locale),
    },
    publisher: {
      '@type': 'Organization',
      name: siteName(locale),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/brand/yourfield-logo-official-b.png'),
      },
    },
  };
}

export function contactPageJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: locale === 'zh' ? '联系我们' : locale === 'ru' ? 'Контакты' : 'Contact',
    url: absoluteUrl(localizedPath(locale, '/contact')),
    inLanguage: locale,
    mainEntity: organizationJsonLd(locale),
  };
}
