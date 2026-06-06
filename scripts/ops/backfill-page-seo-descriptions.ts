import { initPayload } from '../seed/lib/payload';
import { legacyPages } from '../seed/import-legacy-pages';

const locales = ['zh', 'en', 'ru'] as const;

type Locale = (typeof locales)[number];
type PageSeed = (typeof legacyPages)[number];
type QueryablePayload = Awaited<ReturnType<typeof initPayload>> & {
  db: {
    pool: {
      query: (statement: string, values: unknown[]) => Promise<{ rowCount: number | null }>;
    };
  };
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

const backfillLocaleDescription = async ({
  locale,
  page,
  payload,
}: {
  locale: Locale;
  page: PageSeed;
  payload: QueryablePayload;
}) => {
  const description = page.seoDescription[locale];

  // Payload's local API can silently ignore partial updates for localized fields inside
  // a group on draft-enabled collections. For this one-off production SEO backfill,
  // update the live locale table directly and only touch descriptions that are empty
  // or still identical to that locale's page title.
  const result = await payload.db.pool.query(
    `
      WITH target AS (
        SELECT l.id, l._parent_id
        FROM pages AS p
        JOIN pages_locales AS l ON l._parent_id = p.id
        WHERE (p.page_key = $1 OR p."pageKey" = $1)
          AND l._locale = $2
          AND (
            NULLIF(BTRIM(COALESCE(l.seo_description, '')), '') IS NULL
            OR LOWER(BTRIM(COALESCE(l.seo_description, ''))) = LOWER(BTRIM(COALESCE(l.title, '')))
          )
      ),
      updated_locale AS (
        UPDATE pages_locales AS l
        SET seo_description = $3
        FROM target
        WHERE l.id = target.id
        RETURNING target._parent_id
      )
      UPDATE pages AS p
      SET updated_at = NOW()
      WHERE p.id IN (SELECT _parent_id FROM updated_locale)
      RETURNING p.id
    `,
    [page.pageKey, locale, description],
  );

  return result.rowCount && result.rowCount > 0 ? ('updated' as const) : ('skipped' as const);
};

const run = async () => {
  const payload = (await initPayload()) as QueryablePayload;
  const summary = { skipped: 0, updated: 0 };

  for (const page of legacyPages) {
    for (const locale of locales) {
      const result = await backfillLocaleDescription({ locale, page, payload });
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
