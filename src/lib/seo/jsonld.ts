import type { NewsItem } from '@/lib/cms/news';
import type { CmsSiteSettings } from '@/lib/cms/site-settings';
import type { Locale } from '@/lib/i18n/locale';
import { localizedPublicText, publicLocaleText } from '@/lib/product/publicText';
import { productSeoKeywords } from '@/lib/product/seoKeywords';
import { specValue, type Product, type ProductFaq } from '@/lib/product/types';
import { absoluteUrl, localizedPath } from '@/lib/seo/buildMetadata';

export type BreadcrumbItem = Readonly<{
  name: string;
  path: string;
}>;

function organizationName(settings?: CmsSiteSettings) {
  return settings?.siteName || undefined;
}

function organizationLogo(settings?: CmsSiteSettings) {
  return settings?.logoDark?.src ? absoluteUrl(settings.logoDark.src) : undefined;
}

function organizationTelephone(settings?: CmsSiteSettings) {
  return settings?.contact.phoneHref ? settings.contact.phoneHref.replace(/^tel:/, '') : undefined;
}

function organizationEmail(settings?: CmsSiteSettings) {
  return settings?.contact.email || undefined;
}

function organizationStreetAddress(settings?: CmsSiteSettings) {
  return settings?.contact.address || undefined;
}

export function organizationJsonLd(locale: Locale, settings?: CmsSiteSettings) {
  const name = organizationName(settings);
  const logo = organizationLogo(settings);
  const streetAddress = organizationStreetAddress(settings);
  const telephone = organizationTelephone(settings);
  const email = organizationEmail(settings);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: absoluteUrl(localizedPath(locale, '/')),
    foundingDate: '2002',
  };

  if (name) {
    data.name = name;
  }

  if (logo) {
    data.logo = logo;
  }

  if (streetAddress) {
    data.address = {
      '@type': 'PostalAddress',
      streetAddress,
    };
  }

  if (telephone || email) {
    data.contactPoint = {
      '@type': 'ContactPoint',
      ...(telephone ? { telephone } : {}),
      ...(email ? { email } : {}),
      contactType: 'customer service',
      areaServed: ['CN', 'US', 'RU'],
    };
  }

  return data;
}

export function websiteJsonLd(locale: Locale, settings?: CmsSiteSettings) {
  const name = organizationName(settings);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: absoluteUrl(localizedPath(locale, '/')),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(localizedPath(locale, '/search'))}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  if (name) {
    data.name = name;
  }

  return data;
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

export function productJsonLd(product: Product, locale: Locale, settings?: CmsSiteSettings) {
  const path = localizedPath(locale, `/products/${product.id}`);
  const name = localizedPublicText(product.name, locale) || product.id;
  const category = localizedPublicText(product.categoryName, locale);
  const description = localizedPublicText(product.description, locale);
  const alternateNames = productSeoKeywords(product, locale);
  const additionalProperty = product.specifications
    .map((item) => ({
      '@type': 'PropertyValue',
      name: localizedPublicText(item.label, locale),
      value: publicLocaleText(specValue(item.value, locale), locale),
    }))
    .filter((item) => item.name && item.value);
  const brandName = organizationName(settings);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    sku: product.sku || product.model,
    model: product.model,
    image: product.images.filter(Boolean).map((image) => absoluteUrl(image)),
  };

  if (alternateNames.length > 0) {
    data.alternateName = alternateNames;
  }

  if (brandName) {
    data.brand = {
      '@type': 'Brand',
      name: brandName,
    };
  }

  if (category) {
    data.category = category;
  }

  if (description) {
    data.description = description;
  }

  if (additionalProperty.length > 0) {
    data.additionalProperty = additionalProperty;
  }

  return data;
}

export function faqPageJsonLd(faqs: readonly ProductFaq[], locale: Locale, path: string) {
  const mainEntity = faqs
    .map((faq) => ({
      '@type': 'Question',
      name: localizedPublicText(faq.question, locale),
      acceptedAnswer: {
        '@type': 'Answer',
        text: localizedPublicText(faq.answer, locale),
      },
    }))
    .filter((faq) => faq.name && faq.acceptedAnswer.text);

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: absoluteUrl(path),
    inLanguage: locale,
    mainEntity,
  };
}

export function newsArticleJsonLd(
  item: NewsItem,
  locale: Locale,
  title: string,
  description: string,
  settings?: CmsSiteSettings,
) {
  const path = localizedPath(locale, `/news/${item.slug}`);
  const image = item.image ? [absoluteUrl(item.image)] : undefined;
  const orgName = organizationName(settings);
  const orgLogo = organizationLogo(settings);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: locale,
    datePublished: item.datePublished,
    dateModified: item.dateModified ?? item.datePublished,
    ...(image ? { image } : {}),
  };

  if (orgName) {
    data.author = {
      '@type': 'Organization',
      name: orgName,
    };
    data.publisher = {
      '@type': 'Organization',
      name: orgName,
      ...(orgLogo
        ? {
            logo: {
              '@type': 'ImageObject',
              url: orgLogo,
            },
          }
        : {}),
    };
  }

  return data;
}

export function contactPageJsonLd(locale: Locale, settings?: CmsSiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: locale === 'zh' ? '联系我们' : locale === 'ru' ? 'Контакты' : 'Contact',
    url: absoluteUrl(localizedPath(locale, '/contact')),
    inLanguage: locale,
    mainEntity: organizationJsonLd(locale, settings),
  };
}
