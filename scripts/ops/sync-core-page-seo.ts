import { initPayload } from '../seed/lib/payload';
import { coreSeoPageKeys, legacyPages } from '../seed/import-legacy-pages';

const locales = ['zh', 'en', 'ru'] as const;

type Locale = (typeof locales)[number];
type PageSeed = (typeof legacyPages)[number];
type QueryablePayload = Awaited<ReturnType<typeof initPayload>> & {
  db: {
    pool: {
      query: (
        statement: string,
        values: unknown[],
      ) => Promise<{ rows: Array<{ id: string | number }>; rowCount: number | null }>;
    };
  };
};

const coreSeoPages = legacyPages.filter((page) =>
  coreSeoPageKeys.includes(page.pageKey as (typeof coreSeoPageKeys)[number]),
);

const syncLocaleSeo = async ({
  locale,
  page,
  payload,
}: {
  locale: Locale;
  page: PageSeed;
  payload: QueryablePayload;
}) => {
  const result = await payload.db.pool.query(
    `
      WITH target AS (
        SELECT l.id, l._parent_id
        FROM pages AS p
        JOIN pages_locales AS l ON l._parent_id = p.id
        WHERE (p.page_key = $1 OR p."pageKey" = $1)
          AND l._locale = $2
      ),
      updated_locale AS (
        UPDATE pages_locales AS l
        SET
          seo_title = $3,
          seo_description = $4,
          seo_keywords = $5
        FROM target
        WHERE l.id = target.id
        RETURNING target._parent_id
      )
      UPDATE pages AS p
      SET updated_at = NOW()
      WHERE p.id IN (SELECT _parent_id FROM updated_locale)
      RETURNING p.id
    `,
    [
      page.pageKey,
      locale,
      page.seoTitle[locale],
      page.seoDescription[locale],
      page.seoKeywords[locale],
    ],
  );

  return result.rowCount && result.rowCount > 0 ? ('updated' as const) : ('missing' as const);
};

export const syncCorePageSeo = async (payload: QueryablePayload) => {
  const summary = { missing: 0, updated: 0 };

  for (const page of coreSeoPages) {
    for (const locale of locales) {
      const result = await syncLocaleSeo({ locale, page, payload });
      summary[result] += 1;
      console.log(`[core-page-seo] ${result} ${page.pageKey} ${locale}`);
    }
  }

  return summary;
};

const run = async () => {
  const payload = (await initPayload()) as QueryablePayload;
  const summary = await syncCorePageSeo(payload);

  if (summary.missing > 0) {
    throw new Error(`Missing ${summary.missing} localized page rows while syncing core SEO`);
  }

  console.log('[core-page-seo] done', summary);
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[core-page-seo] failed', error instanceof Error ? error.message : error);
    process.exit(1);
  });
