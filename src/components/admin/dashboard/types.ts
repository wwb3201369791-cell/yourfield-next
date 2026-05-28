export type ApiCollectionResponse<TDocument> = Readonly<{
  docs?: TDocument[];
  totalDocs?: number;
}>;

export type SearchStatsResponse = Readonly<{
  ctr?: number;
  ok?: boolean;
  topKeywords?: Array<{
    clicks?: number;
    query?: string;
    searches?: number;
    zeroResultSearches?: number;
  }>;
  totalClicks?: number;
  totalSearches?: number;
  zeroResultSearches?: number;
}>;

export type DashboardHealthLevel = 'good' | 'warning' | 'severe';

export type DashboardHealthSeverity = 'info' | 'warning' | 'severe';

export type DashboardHealthRuleId = 'R1' | 'R2' | 'R3' | 'R5' | 'R6';

export type DashboardHealthItem = Readonly<{
  actionHref: string;
  actionLabel: string;
  count: number;
  label: string;
  ruleId: DashboardHealthRuleId;
  severity: DashboardHealthSeverity;
}>;

export type DashboardHealthResponse = Readonly<{
  computedAt: string;
  items: DashboardHealthItem[];
  level: DashboardHealthLevel;
  score: number;
}>;

export type SearchLogDocument = Readonly<{
  createdAt?: string;
  eventType?: string;
  hits?: number;
  query?: string;
}>;

export type FormSubmissionDocument = Readonly<{
  company?: string;
  createdAt?: string;
  inquiryType?: string;
  name?: string;
  status?: string;
}>;

export type DashboardState = Readonly<{
  formSubmissions: ApiCollectionResponse<FormSubmissionDocument>;
  newFormSubmissions: ApiCollectionResponse<FormSubmissionDocument>;
  overdueFormSubmissions: ApiCollectionResponse<FormSubmissionDocument>;
  previousFormSubmissions: ApiCollectionResponse<FormSubmissionDocument>;
  previousNewFormSubmissions: ApiCollectionResponse<FormSubmissionDocument>;
  previousProductGroups: ApiCollectionResponse<Record<string, unknown>>;
  previousProducts: ApiCollectionResponse<Record<string, unknown>>;
  previousSearchLogs: ApiCollectionResponse<SearchLogDocument>;
  health: DashboardHealthResponse;
  productGroups: ApiCollectionResponse<Record<string, unknown>>;
  products: ApiCollectionResponse<Record<string, unknown>>;
  searchLogs: ApiCollectionResponse<SearchLogDocument>;
  searchStats: SearchStatsResponse;
}>;

export type LoadState =
  | Readonly<{ status: 'idle' | 'loading' }>
  | Readonly<{ data: DashboardState; status: 'ready' }>
  | Readonly<{ message: string; status: 'error' }>;

export const dashboardRangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
] as const;

export type DashboardRangeDays = (typeof dashboardRangeOptions)[number]['value'];

export type TopKeyword = NonNullable<SearchStatsResponse['topKeywords']>[number];

export type DashboardChartPoint = Readonly<{
  clicks: number;
  dateKey: string;
  forms: number;
  label: string;
  searches: number;
  total: number;
}>;

export type DashboardFormSummary = Readonly<{
  meta: string;
  name: string;
  status: string;
}>;

export type DashboardMetricTone = 'blue' | 'red' | 'navy' | 'amber';

export type DashboardMetricVisual = 'search' | 'leads' | 'products' | 'groups' | 'zero-results';

export type DashboardMetricTrendTone = 'up' | 'down' | 'flat';

export type DashboardMetric = Readonly<{
  href: string;
  label: string;
  meta: string;
  trendLabel?: string;
  trendTone?: DashboardMetricTrendTone;
  tone: DashboardMetricTone;
  value: number;
  visual: DashboardMetricVisual;
}>;

export type AdminOperationsDashboardProps = Readonly<{
  adminBase: string;
  apiBase: string;
}>;
