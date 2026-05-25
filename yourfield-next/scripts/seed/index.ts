import { importLegacyCategories } from './import-legacy-categories';
import { importExtractedProducts } from './import-extracted-products';
import { importLegacyMedia } from './import-legacy-media';
import { importLegacyNavigation } from './import-legacy-navigation';
import { importLegacyNews } from './import-legacy-news';
import { importLegacyPages } from './import-legacy-pages';
import { importLegacyProducts } from './import-legacy-products';
import { importLegacySiteSettings } from './import-legacy-site-settings';
import { importLegacySolutions } from './import-legacy-solutions';
import { importProductGroups } from './import-product-groups';
import { initPayload } from './lib/payload';
import { addResult, emptyResult, parseSeedOptions } from './lib/shared';
import { seedSuperadmin } from './seed-superadmin';

const formatSeedError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return error;
  }

  const details = (error as { data?: unknown }).data;
  if (!details) {
    return error.message;
  }

  return `${error.message} ${JSON.stringify(details)}`;
};

const run = async () => {
  const options = parseSeedOptions();
  const payload = await initPayload();
  const total = emptyResult();

  const media = await importLegacyMedia(payload, options);
  addResult(total, media);
  console.log('[seed] media', media);

  const productGroups = await importProductGroups(payload, options);
  addResult(total, productGroups);
  console.log('[seed] product-groups', productGroups);

  const categories = await importLegacyCategories(payload, options);
  addResult(total, categories);
  console.log('[seed] categories', categories);

  const pages = await importLegacyPages(payload, options);
  addResult(total, pages);
  console.log('[seed] pages', pages);

  const products = await importLegacyProducts(payload, options, media.manifest);
  addResult(total, products);
  console.log('[seed] products', products);

  const extractedProducts = await importExtractedProducts(payload, options);
  addResult(total, extractedProducts);
  console.log('[seed] extracted-products', extractedProducts);

  const solutions = await importLegacySolutions(payload, options, media.manifest);
  addResult(total, solutions);
  console.log('[seed] solutions', solutions);

  const news = await importLegacyNews(payload, options, media.manifest);
  addResult(total, news);
  console.log('[seed] news', news);

  const navigation = await importLegacyNavigation(payload, options);
  addResult(total, navigation);
  console.log('[seed] navigation', navigation);

  const siteSettings = await importLegacySiteSettings(payload, options, media.manifest);
  addResult(total, siteSettings);
  console.log('[seed] site-settings', siteSettings);

  const superadmin = await seedSuperadmin(payload, options);
  addResult(total, superadmin);
  console.log('[seed] superadmin', { ...superadmin, userPassword: '[REDACTED]' });

  console.log('[seed] done', total);
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[seed] failed', formatSeedError(error));
    process.exit(1);
  });
