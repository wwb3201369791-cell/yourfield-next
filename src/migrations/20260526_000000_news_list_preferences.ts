import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type AdminListColumn =
  | string
  | {
      accessor?: unknown;
      [key: string]: unknown;
    };

type AdminListPreference = {
  columns?: unknown;
  [key: string]: unknown;
};

type PreferenceRow = {
  id: number;
  value: unknown;
};

type QueryResult = {
  rows?: PreferenceRow[];
};

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string, values?: unknown[]) => Promise<QueryResult>;
    };
  };
};

const newsListPreferenceKey = 'news-list';
const removedNewsListColumns = new Set(['isFeatured']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function columnAccessor(column: AdminListColumn): string | null {
  if (typeof column === 'string') {
    return column;
  }

  return typeof column.accessor === 'string' ? column.accessor : null;
}

export function normalizeNewsListPreferenceValue(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray((value as AdminListPreference).columns)) {
    return value;
  }

  const columns = (value as AdminListPreference).columns as AdminListColumn[];
  const nextColumns = columns.filter((column) => {
    const accessor = columnAccessor(column);

    return !accessor || !removedNewsListColumns.has(accessor);
  });

  if (nextColumns.length === columns.length) {
    return value;
  }

  return {
    ...value,
    columns: nextColumns,
  };
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;
  const result = await db.pool.query(
    'SELECT "id", "value" FROM "payload_preferences" WHERE "key" = $1',
    [newsListPreferenceKey],
  );

  for (const row of result.rows ?? []) {
    const normalizedValue = normalizeNewsListPreferenceValue(row.value);

    if (normalizedValue === row.value) {
      continue;
    }

    await db.pool.query(
      'UPDATE "payload_preferences" SET "value" = $1, "updated_at" = NOW() WHERE "id" = $2',
      [JSON.stringify(normalizedValue), row.id],
    );
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: keep cleaned admin list preferences in place.
}
