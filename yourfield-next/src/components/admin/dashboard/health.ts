import type {
  DashboardHealthItem,
  DashboardHealthLevel,
  DashboardHealthResponse,
  DashboardHealthRuleId,
  DashboardHealthSeverity,
} from './types';

type DashboardHealthSource = Readonly<{
  adminBase: string;
  news: readonly unknown[];
  now?: Date;
  overdueSubmissions: readonly unknown[];
  productGroups: readonly unknown[];
  products: readonly unknown[];
}>;

type RuleDefinition = Readonly<{
  actionLabel: string;
  label: string;
  ruleId: DashboardHealthRuleId;
  severity: DashboardHealthSeverity;
  scorePenalty: (count: number) => number;
}>;

const externalLocales = ['en', 'ru'] as const;

const ruleDefinitions: readonly RuleDefinition[] = [
  {
    actionLabel: '去补图',
    label: '已发布产品缺主图',
    ruleId: 'R1',
    scorePenalty: (count) => cappedPenalty(count, 5, 20),
    severity: 'severe',
  },
  {
    actionLabel: '去补产品',
    label: '展示中产品大类无产品',
    ruleId: 'R2',
    scorePenalty: (count) => cappedPenalty(count, 5, 15),
    severity: 'severe',
  },
  {
    actionLabel: '去补译',
    label: '已发布产品英文/俄文缺失',
    ruleId: 'R3',
    scorePenalty: (count) => groupedPenalty(count, 10, 2, 10),
    severity: 'warning',
  },
  {
    actionLabel: '去补写',
    label: '已发布产品 SEO 描述缺失',
    ruleId: 'R4',
    scorePenalty: (count) => groupedPenalty(count, 5, 2, 10),
    severity: 'warning',
  },
  {
    actionLabel: '去更新',
    label: '最近 30 天无新闻更新',
    ruleId: 'R5',
    scorePenalty: (count) => (count > 0 ? 5 : 0),
    severity: 'info',
  },
  {
    actionLabel: '去回复',
    label: '48 小时未处理的新询盘',
    ruleId: 'R6',
    scorePenalty: (count) => cappedPenalty(count, 5, 20),
    severity: 'severe',
  },
];

function cappedPenalty(count: number, step: number, cap: number) {
  if (count <= 0) {
    return 0;
  }

  return Math.min(count * step, cap);
}

function groupedPenalty(count: number, groupSize: number, step: number, cap: number) {
  if (count <= 0) {
    return 0;
  }

  return Math.min(Math.ceil(count / groupSize) * step, cap);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getPathValue(source: unknown, path: readonly string[]) {
  let current = source;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function relationId(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const id = value.id;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : undefined;
}

function documentId(value: unknown) {
  return relationId(value);
}

function isPublishedProduct(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return value._status === 'published';
}

function productHasImage(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.images)) {
    return false;
  }

  return value.images.some((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    const file = entry.file;
    return Boolean(file);
  });
}

function hasLocalizedValue(value: unknown, locale: (typeof externalLocales)[number]) {
  if (typeof value === 'string') {
    return false;
  }

  if (!isRecord(value)) {
    return false;
  }

  return stringValue(value[locale]).length > 0;
}

function hasExternalLocaleGap(value: unknown) {
  return externalLocales.some((locale) => !hasLocalizedValue(value, locale));
}

function productMissingExternalName(value: unknown) {
  return hasExternalLocaleGap(getPathValue(value, ['name']));
}

function productMissingSeoDescription(value: unknown) {
  const description = getPathValue(value, ['seo', 'description']);

  if (stringValue(description).length > 0) {
    return false;
  }

  return hasExternalLocaleGap(description);
}

function groupVisibleOnFrontend(value: unknown) {
  return isRecord(value) && value.showOnFrontend !== false;
}

function countEmptyProductGroups(
  productGroups: readonly unknown[],
  publishedProducts: readonly unknown[],
) {
  const productGroupIds = new Set(
    publishedProducts
      .map((product) => (isRecord(product) ? relationId(product.productGroup) : undefined))
      .filter(Boolean),
  );

  return productGroups.filter((group) => {
    if (!groupVisibleOnFrontend(group)) {
      return false;
    }

    const id = documentId(group);
    return Boolean(id && !productGroupIds.has(id));
  }).length;
}

function cutoffIso(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

export function buildAdminCollectionHref(
  adminBase: string,
  collectionSlug: string,
  params: Readonly<Record<string, string>> = {},
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const base = adminBase.replace(/\/$/, '');
  const query = search.toString();

  return `${base}/collections/${collectionSlug}${query ? `?${query}` : ''}`;
}

function actionHrefForRule(ruleId: DashboardHealthRuleId, adminBase: string, now: Date) {
  switch (ruleId) {
    case 'R1':
    case 'R3':
    case 'R4':
      return buildAdminCollectionHref(adminBase, 'products', {
        'where[_status][equals]': 'published',
      });
    case 'R2':
      return buildAdminCollectionHref(adminBase, 'product-groups', {
        'where[showOnFrontend][not_equals]': 'false',
      });
    case 'R5':
      return buildAdminCollectionHref(adminBase, 'news', {
        'where[_status][equals]': 'published',
      });
    case 'R6':
      return buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[createdAt][less_than]': cutoffIso(now, 48),
        'where[status][equals]': 'new',
      });
  }
}

function levelForScore(score: number): DashboardHealthLevel {
  if (score >= 90) {
    return 'good';
  }

  return score >= 60 ? 'warning' : 'severe';
}

export function buildDashboardHealthResponse({
  adminBase,
  news,
  now = new Date(),
  overdueSubmissions,
  productGroups,
  products,
}: DashboardHealthSource): DashboardHealthResponse {
  const publishedProducts = products.filter(isPublishedProduct);
  const counts: Record<DashboardHealthRuleId, number> = {
    R1: publishedProducts.filter((product) => !productHasImage(product)).length,
    R2: countEmptyProductGroups(productGroups, publishedProducts),
    R3: publishedProducts.filter(productMissingExternalName).length,
    R4: publishedProducts.filter(productMissingSeoDescription).length,
    R5: news.length === 0 ? 1 : 0,
    R6: overdueSubmissions.length,
  };

  const items: DashboardHealthItem[] = ruleDefinitions.map((rule) => ({
    actionHref: actionHrefForRule(rule.ruleId, adminBase, now),
    actionLabel: rule.actionLabel,
    count: counts[rule.ruleId],
    label: rule.label,
    ruleId: rule.ruleId,
    severity: rule.severity,
  }));

  const penalty = ruleDefinitions.reduce(
    (total, rule) => total + rule.scorePenalty(counts[rule.ruleId]),
    0,
  );
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    computedAt: now.toISOString(),
    items,
    level: levelForScore(score),
    score,
  };
}

export function dashboardHealthSeverityLabel(severity: DashboardHealthSeverity) {
  switch (severity) {
    case 'severe':
      return '严重';
    case 'warning':
      return '提醒';
    case 'info':
      return '观察';
  }
}

export function dashboardHealthLevelLabel(level: DashboardHealthLevel) {
  switch (level) {
    case 'good':
      return '良好';
    case 'warning':
      return '注意';
    case 'severe':
      return '严重';
  }
}
