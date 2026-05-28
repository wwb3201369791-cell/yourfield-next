'use client';

import type { FormEvent } from 'react';

import { CloseIcon, SearchIcon } from '@/components/ui/icons';

import type { SearchResultsCopy } from './search-results-types';
import { maxQueryLength } from './search-results-utils';

type SearchFormProps = Readonly<{
  copy: SearchResultsCopy;
  draftQuery: string;
  inputId: string;
  isLoading: boolean;
  onClear: () => void;
  onDraftQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
}>;

export function SearchForm({
  copy,
  draftQuery,
  inputId,
  isLoading,
  onClear,
  onDraftQueryChange,
  onSubmit,
}: SearchFormProps) {
  return (
    <form
      className="grid gap-3 rounded border border-border bg-bg-light p-4 shadow-sm md:grid-cols-[1fr_auto] md:p-5"
      role="search"
      aria-label={copy.searchLabel}
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {copy.queryLabel}
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-current stroke-2 text-text-lighter" />
        <input
          id={inputId}
          className="focus:ring-accent/10 min-h-12 w-full rounded border border-border bg-white py-3 pl-12 pr-12 text-base font-semibold text-primary outline-none transition focus:border-accent focus:ring-4"
          type="search"
          name="q"
          autoComplete="off"
          value={draftQuery}
          placeholder={copy.placeholder}
          maxLength={maxQueryLength + 20}
          onChange={(event) => onDraftQueryChange(event.target.value)}
        />
        {draftQuery ? (
          <button
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-text-light hover:bg-bg-light hover:text-accent"
            type="button"
            aria-label={copy.clear}
            onClick={onClear}
          >
            <CloseIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
          </button>
        ) : null}
      </div>
      <button className="btn btn-primary min-w-28" type="submit" disabled={isLoading}>
        {isLoading ? copy.loadingShort : copy.submit}
      </button>
    </form>
  );
}
