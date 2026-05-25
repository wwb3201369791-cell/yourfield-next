import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type AdminListColumn =
  | string
  | {
      accessor?: unknown;
      active?: unknown;
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

export const statusPreferenceKeys = ['products-list', 'news-list', 'solutions-list'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function columnAccessor(column: AdminListColumn): string | null {
  if (typeof column === 'string') {
    return column;
  }

  return typeof column.accessor === 'string' ? column.accessor : null;
}

function normalizeStatusAccessor(accessor: string) {
  return accessor === '_status' ? 'statusBadge' : accessor;
}

function normalizeColumn(column: AdminListColumn) {
  const accessor = columnAccessor(column);

  if (!accessor) {
    return { changed: false, column };
  }

  const normalizedAccessor = normalizeStatusAccessor(accessor);
  const changed = normalizedAccessor !== accessor || typeof column === 'string';

  if (typeof column === 'string') {
    return {
      changed,
      column: {
        accessor: normalizedAccessor,
        active: true,
      },
    };
  }

  return {
    changed,
    column: {
      ...column,
      accessor: normalizedAccessor,
    },
  };
}

export function normalizeAdminListPreferenceValue(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray((value as AdminListPreference).columns)) {
    return value;
  }

  const columns = (value as AdminListPreference).columns as AdminListColumn[];
  const byAccessor = new Map<string, { column: AdminListColumn; index: number }>();
  const nextColumns: AdminListColumn[] = [];
  let changed = false;

  columns.forEach((column) => {
    const normalized = normalizeColumn(column);
    const accessor = columnAccessor(normalized.column);

    changed ||= normalized.changed;

    if (!accessor) {
      nextColumns.push(normalized.column);
      return;
    }

    const existing = byAccessor.get(accessor);

    if (existing) {
      changed = true;

      const existingActive =
        typeof existing.column === 'string' ? true : Boolean(existing.column.active);
      const normalizedActive =
        typeof normalized.column === 'string' ? true : Boolean(normalized.column.active);

      if (isRecord(existing.column)) {
        existing.column.active = existingActive || normalizedActive;
      }

      return;
    }

    byAccessor.set(accessor, { column: normalized.column, index: nextColumns.length });
    nextColumns.push(normalized.column);
  });

  if (!byAccessor.has('statusBadge')) {
    changed = true;

    const statusBadgeColumn: AdminListColumn = {
      accessor: 'statusBadge',
      active: true,
    };
    const publishedAtIndex = nextColumns.findIndex(
      (column) => columnAccessor(column) === 'publishedAt',
    );

    if (publishedAtIndex === -1) {
      nextColumns.push(statusBadgeColumn);
    } else {
      nextColumns.splice(publishedAtIndex, 0, statusBadgeColumn);
    }
  }

  if (!changed) {
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
    'SELECT "id", "value" FROM "payload_preferences" WHERE "key" = ANY($1)',
    [statusPreferenceKeys],
  );

  for (const row of result.rows ?? []) {
    const normalizedValue = normalizeAdminListPreferenceValue(row.value);

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
  // Non-destructive: keep normalized admin list preferences in place.
}
