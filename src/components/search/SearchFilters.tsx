'use client';

import type { SearchRequestType, SearchResponse } from '@/lib/search/types';

import type { SearchResultsCopy, SearchUrlPatch, SearchUrlState } from './search-results-types';
import { selectedTypeCount } from './search-results-utils';

type SearchFiltersProps = Readonly<{
  categoryItems: readonly (readonly [string, number])[];
  categoryLabels: ReadonlyMap<string, string>;
  copy: SearchResultsCopy;
  hasQuery: boolean;
  isLoading: boolean;
  response: SearchResponse | null;
  updateUrl: (patch: SearchUrlPatch) => void;
  urlState: SearchUrlState;
}>;

const displayedRequestTypes = [
  'all',
  'product',
  'solution',
  'industry-case',
  'news',
] as const satisfies readonly SearchRequestType[];

export function SearchFilters({
  categoryItems,
  categoryLabels,
  copy,
  hasQuery,
  isLoading,
  response,
  updateUrl,
  urlState,
}: SearchFiltersProps) {
  return (
    <aside className="rounded border border-border bg-bg-light p-5" aria-label={copy.filtersLabel}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-primary">{copy.filtersLabel}</h2>
        {(urlState.type !== 'all' || urlState.category) && hasQuery ? (
          <button
            className="text-sm font-bold text-primary hover:text-accent"
            type="button"
            onClick={() => updateUrl({ category: null, page: 1, type: 'all' })}
          >
            {copy.clearFilters}
          </button>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-sm font-bold text-primary">{copy.contentTypeLabel}</p>
        <div className="mt-3 grid gap-2">
          {displayedRequestTypes
            .filter((type) => {
              if (type === 'all' || type === urlState.type) {
                return true;
              }

              return selectedTypeCount(response, type) > 0;
            })
            .map((type) => (
              <button
                key={type}
                className={[
                  'flex min-h-10 items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition',
                  urlState.type === type
                    ? 'border-accent bg-white text-accent'
                    : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                  !hasQuery || isLoading ? 'cursor-not-allowed opacity-60' : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                aria-pressed={urlState.type === type}
                disabled={!hasQuery || isLoading}
                onClick={() => updateUrl({ page: 1, type })}
              >
                <span>{copy.typeLabels[type]}</span>
                <span className="text-xs text-text-lighter">
                  {selectedTypeCount(response, type)}
                </span>
              </button>
            ))}
        </div>
      </div>

      {categoryItems.length > 0 && (urlState.type === 'all' || urlState.type === 'product') ? (
        <div className="mt-7">
          <p className="text-sm font-bold text-primary">{copy.categoryLabel}</p>
          <div className="mt-3 grid gap-2">
            <button
              className={[
                'flex min-h-10 items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition',
                !urlState.category
                  ? 'border-accent bg-white text-accent'
                  : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                isLoading ? 'cursor-not-allowed opacity-60' : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              aria-pressed={!urlState.category}
              disabled={isLoading}
              onClick={() => updateUrl({ category: null, page: 1 })}
            >
              {copy.allCategories}
            </button>
            {categoryItems.map(([category, count]) => (
              <button
                key={category}
                className={[
                  'flex min-h-10 items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition',
                  urlState.category === category
                    ? 'border-accent bg-white text-accent'
                    : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                  isLoading ? 'cursor-not-allowed opacity-60' : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                aria-pressed={urlState.category === category}
                disabled={isLoading}
                onClick={() => updateUrl({ category, page: 1 })}
              >
                <span className="truncate">{categoryLabels.get(category) ?? category}</span>
                <span className="text-xs text-text-lighter">{count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
