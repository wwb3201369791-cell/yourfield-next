'use client';

import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { ArrowRightIcon, CloseIcon, SearchIcon } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n/locale';
import { useTranslations } from '@/lib/i18n/useTranslations';
import { resolveSearchNavigationHref } from '@/lib/search/directNavigation';
import type { SearchSuggestion, SearchSuggestResponse } from '@/lib/search/types';

type SearchTriggerProps = Readonly<{
  locale: Locale;
}>;

type SearchSuggestApiPayload = SearchSuggestResponse | Readonly<{ ok: false }>;

const suggestionLimit = 5;

function compactSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function searchHref(locale: Locale, term: string) {
  const params = new URLSearchParams({ q: term });

  return `/${locale}/search?${params.toString()}`;
}

function suggestionHref(locale: Locale, suggestion: SearchSuggestion) {
  return suggestion.url?.startsWith('/') ? suggestion.url : searchHref(locale, suggestion.term);
}

export function SearchTrigger({ locale }: SearchTriggerProps) {
  const t = useTranslations();
  const router = useRouter();
  const suggestionsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isResolvingSubmit, setIsResolvingSubmit] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('yourfield:search:open'));
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = compactSearchTerm(query);

    setActiveSuggestionIndex(-1);

    if (!normalizedQuery) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams({
        limit: String(suggestionLimit),
        locale,
        q: normalizedQuery,
      });

      void (async () => {
        try {
          const response = await fetch(`/api/search/suggest?${params.toString()}`, {
            cache: 'no-store',
            signal: controller.signal,
          });
          const payload = (await response.json()) as SearchSuggestApiPayload;

          if (!response.ok || !payload.ok) {
            setSuggestions([]);
            return;
          }

          setSuggestions(payload.suggestions);
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }

          setSuggestions([]);
        }
      })();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [locale, query]);

  function navigateToSuggestion(suggestion: SearchSuggestion) {
    setIsSuggestionsOpen(false);
    setSuggestions([]);
    setQuery(suggestion.term);
    router.push(suggestionHref(locale, suggestion));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = compactSearchTerm(query);
    const searchParams = trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : '';
    const fallbackHref = `/${locale}/search${searchParams}`;

    setIsSuggestionsOpen(false);

    if (!trimmedQuery) {
      router.push(fallbackHref);
      return;
    }

    setIsResolvingSubmit(true);

    try {
      const directHref = await resolveSearchNavigationHref(locale, trimmedQuery);

      router.push(directHref ?? fallbackHref);
    } finally {
      setIsResolvingSubmit(false);
    }
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const hasSuggestions = isSuggestionsOpen && suggestions.length > 0;

    if (!hasSuggestions) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Escape') {
      setIsSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      const activeSuggestion = suggestions[activeSuggestionIndex];

      if (!activeSuggestion) {
        return;
      }

      event.preventDefault();
      navigateToSuggestion(activeSuggestion);
    }
  }

  const hasQuery = Boolean(compactSearchTerm(query));
  const showSuggestions = isSuggestionsOpen && hasQuery && suggestions.length > 0;

  return (
    <form
      className={hasQuery ? 'search-box has-query' : 'search-box'}
      role="search"
      data-search-form
      aria-busy={isResolvingSubmit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsSuggestionsOpen(false);
          setActiveSuggestionIndex(-1);
        }
      }}
      onFocus={() => setIsSuggestionsOpen(true)}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <span className="search-box-icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="search"
        name="q"
        autoComplete="off"
        value={query}
        placeholder={t('search.shortPlaceholder')}
        role="combobox"
        aria-label={t('search.label')}
        aria-autocomplete="list"
        aria-controls={showSuggestions ? suggestionsId : undefined}
        aria-haspopup="listbox"
        aria-expanded={showSuggestions}
        maxLength={100}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsSuggestionsOpen(true);
        }}
        onKeyDown={handleInputKeyDown}
      />
      <button
        className="search-box-clear"
        type="button"
        aria-label={t('search.clear')}
        hidden={!query}
        onClick={() => {
          setQuery('');
          inputRef.current?.focus();
        }}
      >
        <CloseIcon />
      </button>
      <span className="search-shortcut" aria-hidden="true">
        Ctrl K
      </span>
      <button
        className="search-box-submit"
        type="submit"
        aria-label={t('search.submit')}
        disabled={isResolvingSubmit}
      >
        <ArrowRightIcon />
      </button>
      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1400] overflow-hidden rounded border border-white/70 bg-white/95 shadow-xl backdrop-blur-xl">
          <ul id={suggestionsId} role="listbox" aria-label={t('search.suggestions')}>
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.type}:${suggestion.term}`} role="presentation">
                <button
                  className={[
                    'flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-semibold text-primary transition hover:bg-bg-light hover:text-accent focus:bg-bg-light focus:text-accent focus:outline-none',
                    index === activeSuggestionIndex ? 'bg-bg-light text-accent' : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  onClick={() => navigateToSuggestion(suggestion)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <span className="truncate">{suggestion.term}</span>
                  {typeof suggestion.count === 'number' ? (
                    <span className="text-xs text-text-lighter">{suggestion.count}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
