import { initPayload } from '../seed/lib/payload';
import { legacyPages } from '../seed/import-legacy-pages';

const locales = ['zh', 'en', 'ru'] as const;

type Locale = (typeof locales)[number];

type PageSeed = (typeof legacyPages)[number];

type PageDocument = {
  id?: string | number;
  seo?: {
    title?: string | null;
    description?: string | null;
    noindex?: boolean | null;
    image?: unknown;
    canonical?: string | null;
  } | null;
};

const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const shouldBackfillDescription = ({
  currentDescription,
  title,
}: {
  currentDescription: unknown;
  title: string;
}) => {
  const description = trim(currentDescription);

  if (!description) {
    return true;
  }

  return description.toLocaleLowerCase() === title.trim().toLocaleLowerCase();
};

const findPage = async (
  payload: Awaited<ReturnType<typeof initPayload>>,
  pageKey: PageSeed['pageKey'],
) => {
  const result = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      pageKey: {
        equals: pageKey,
      },
    },
  });

  return result.docs[0] as PageDocument | undefined;
};

const updateLocaleDescription = async ({
  locale,
  page,
  pageId,
  payload,
}: {
  locale: Locale;
  page: PageSeed;
  pageId: string;
  payload: Awaited<ReturnType<typeof initPayload>>;
}) => {
  const localized = (await payload.findByID({
    collection: 'pages',
    depth: 0,
    id: pageId,
    locale,
    overrideAccess: true,
  })) as PageDocument;

  const title = page.title[locale];
  const description = page.seoDescription[locale];
  const currentSeo = localized.seo ?? {};

  if (!shouldBackfillDescription({ currentDescription: currentSeo.description, title })) {
    return 'skipped' as const;
  }

  await payload.update({
    collection: 'pages',
    data: {
      seo: {
        ...currentSeo,
        description,
      },
    },
    depth: 0,
    id: pageId,
    locale,
    overrideAccess: true,
  });

  return 'updated' as const;
};

const run = async () => {
  const payload = await initPayload();
  const summary = { missing: 0, skipped: 0, updated: 0 };

  for (const page of legacyPages) {
    const existing = await findPage(payload, page.pageKey);

    if (!existing?.id) {
      summary.missing += 1;
      console.warn(`[page-seo] missing page ${page.pageKey}`);
      continue;
    }

    const pageId = String(existing.id);

    for (const locale of locales) {
      const result = await updateLocaleDescription({ locale, page, pageId, payload });
      summary[result] += 1;
      console.log(`[page-seo] ${result} ${page.pageKey} ${locale}`);
    }
  }

  console.log('[page-seo] done', summary);
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[page-seo] failed', error instanceof Error ? error.message : error);
    process.exit(1);
  });
