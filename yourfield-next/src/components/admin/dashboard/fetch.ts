import { deriveSearchStats } from './deriveSearchStats';
import { rangeStartDate } from './format';
import type {
  ApiCollectionResponse,
  DashboardRangeDays,
  DashboardHealthResponse,
  DashboardState,
  FormSubmissionDocument,
  SearchLogDocument,
} from './types';

async function fetchJson<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  return (await response.json()) as TResponse;
}

function buildQuery(params: Readonly<Record<string, string>>) {
  const search = new URLSearchParams(params);

  return search.toString();
}

export async function fetchDashboardState(
  apiBase: string,
  rangeDays: DashboardRangeDays,
): Promise<DashboardState> {
  const currentRangeStart = rangeStartDate(rangeDays);
  const previousRangeStart = new Date(currentRangeStart);
  previousRangeStart.setDate(previousRangeStart.getDate() - rangeDays);

  const rangeStartIso = currentRangeStart.toISOString();
  const previousRangeStartIso = previousRangeStart.toISOString();
  const overdueCutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rangeParams = {
    depth: '0',
    sort: '-createdAt',
    'where[createdAt][greater_than_equal]': rangeStartIso,
  };
  const previousRangeParams = {
    depth: '0',
    sort: '-createdAt',
    'where[createdAt][greater_than_equal]': previousRangeStartIso,
    'where[createdAt][less_than]': rangeStartIso,
  };
  const [
    searchLogs,
    formSubmissions,
    newFormSubmissions,
    overdueFormSubmissions,
    previousSearchLogs,
    previousFormSubmissions,
    previousNewFormSubmissions,
    products,
    previousProducts,
    productGroups,
    previousProductGroups,
    health,
  ] = await Promise.all([
    fetchJson<ApiCollectionResponse<SearchLogDocument>>(
      `${apiBase}/search-logs?${buildQuery({
        ...rangeParams,
        limit: '1000',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<FormSubmissionDocument>>(
      `${apiBase}/form-submissions?${buildQuery({
        ...rangeParams,
        limit: '500',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<FormSubmissionDocument>>(
      `${apiBase}/form-submissions?${buildQuery({
        ...rangeParams,
        limit: '1',
        'where[status][equals]': 'new',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<FormSubmissionDocument>>(
      `${apiBase}/form-submissions?${buildQuery({
        depth: '0',
        limit: '1',
        sort: '-createdAt',
        'where[createdAt][less_than]': overdueCutoffIso,
        'where[status][equals]': 'new',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<SearchLogDocument>>(
      `${apiBase}/search-logs?${buildQuery({
        ...previousRangeParams,
        limit: '1',
        'where[eventType][equals]': 'search',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<FormSubmissionDocument>>(
      `${apiBase}/form-submissions?${buildQuery({
        ...previousRangeParams,
        limit: '1',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<FormSubmissionDocument>>(
      `${apiBase}/form-submissions?${buildQuery({
        ...previousRangeParams,
        limit: '1',
        'where[status][equals]': 'new',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<Record<string, unknown>>>(
      `${apiBase}/products?${buildQuery({
        depth: '0',
        limit: '1',
        'where[_status][equals]': 'published',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<Record<string, unknown>>>(
      `${apiBase}/products?${buildQuery({
        depth: '0',
        limit: '1',
        'where[createdAt][less_than]': rangeStartIso,
        'where[_status][equals]': 'published',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<Record<string, unknown>>>(
      `${apiBase}/product-groups?${buildQuery({
        depth: '0',
        limit: '1',
        'where[showOnFrontend][not_equals]': 'false',
      })}`,
    ),
    fetchJson<ApiCollectionResponse<Record<string, unknown>>>(
      `${apiBase}/product-groups?${buildQuery({
        depth: '0',
        limit: '1',
        'where[createdAt][less_than]': rangeStartIso,
        'where[showOnFrontend][not_equals]': 'false',
      })}`,
    ),
    fetchJson<DashboardHealthResponse>(`${apiBase}/dashboard/health`),
  ]);

  return {
    formSubmissions,
    health,
    newFormSubmissions,
    overdueFormSubmissions,
    previousFormSubmissions,
    previousNewFormSubmissions,
    previousProductGroups,
    previousProducts,
    previousSearchLogs,
    productGroups,
    products,
    searchLogs,
    searchStats: deriveSearchStats(searchLogs),
  };
}
