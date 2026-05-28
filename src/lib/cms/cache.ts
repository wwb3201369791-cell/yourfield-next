export const CMS_CACHE_REVALIDATE_SECONDS = 300;

type CmsCollectionCacheSlug =
  | 'pages'
  | 'product-groups'
  | 'products'
  | 'product-categories'
  | 'solutions'
  | 'news'
  | 'faqs';
type CmsGlobalCacheSlug = 'navigation' | 'site-settings';

export function cmsCollectionCacheTag(collection: CmsCollectionCacheSlug) {
  return `cms:collection:${collection}`;
}

export function cmsGlobalCacheTag(global: CmsGlobalCacheSlug) {
  return `cms:global:${global}`;
}
