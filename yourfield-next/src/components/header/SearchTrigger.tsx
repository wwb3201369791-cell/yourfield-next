'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { ArrowRightIcon, CloseIcon, SearchIcon } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n/locale';
import { useTranslations } from '@/lib/i18n/useTranslations';

type SearchTriggerProps = Readonly<{
  locale: Locale;
}>;

export function SearchTrigger({ locale }: SearchTriggerProps) {
  const t = useTranslations();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    const searchParams = trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : '';

    router.push(`/${locale}/products${searchParams}`);
  }

  return (
    <form
      className={query.trim() ? 'search-box has-query' : 'search-box'}
      role="search"
      data-search-form
      data-product-search
      onSubmit={handleSubmit}
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
        aria-label={t('search.label')}
        onChange={(event) => setQuery(event.target.value)}
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
      <button className="search-box-submit" type="submit" aria-label={t('search.submit')}>
        <ArrowRightIcon />
      </button>
    </form>
  );
}
