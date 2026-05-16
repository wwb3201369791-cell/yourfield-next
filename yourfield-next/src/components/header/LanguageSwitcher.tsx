'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { GlobeIcon } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n/locale';
import { getHtmlLang, locales } from '@/lib/i18n/locale';

type LanguageSwitcherProps = Readonly<{
  locale: Locale;
}>;

const languageOptions: Record<Locale, { code: string; name: string; lang: string }> = {
  zh: {
    code: 'CN',
    name: '简体中文',
    lang: 'zh-CN',
  },
  en: {
    code: 'EN',
    name: 'English',
    lang: 'en',
  },
  ru: {
    code: 'RU',
    name: 'Русский',
    lang: 'ru',
  },
};

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    setIsSwitching(false);
  }, [locale]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function switchTo(nextLocale: Locale) {
    if (nextLocale === locale) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    document.cookie = `yourfield.locale=${nextLocale}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    document.documentElement.lang = getHtmlLang(nextLocale);

    const nextPath = pathname.replace(/^\/(zh|en|ru)(?=\/|$)/, `/${nextLocale}`);
    router.push(nextPath || `/${nextLocale}`);
    setIsOpen(false);
  }

  return (
    <div
      ref={menuRef}
      className={[
        'language-menu',
        isOpen ? 'is-open' : undefined,
        isSwitching ? 'is-switching' : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      data-language-menu
    >
      <button
        className="language-menu-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('language.label')}
        data-language-trigger
        onClick={() => {
          window.dispatchEvent(new CustomEvent('yourfield:language:open'));
          setIsOpen((current) => !current);
        }}
      >
        <GlobeIcon className="language-menu-icon" />
        <span className="language-menu-current">{languageOptions[locale].code}</span>
        <span className="language-menu-caret" aria-hidden="true" />
      </button>

      <div
        className="language-menu-panel"
        role="listbox"
        aria-label={t('language.label')}
        data-language-panel
        hidden={!isOpen}
      >
        {locales.map((optionLocale) => {
          const option = languageOptions[optionLocale];
          const isActive = optionLocale === locale;

          return (
            <button
              key={optionLocale}
              className={isActive ? 'language-option is-active' : 'language-option'}
              type="button"
              role="option"
              aria-selected={isActive}
              lang={option.lang}
              disabled={isSwitching}
              onClick={() => switchTo(optionLocale)}
            >
              <span className="language-option-copy">
                <span className="language-option-name">{option.name}</span>
                <span className="language-option-code">{option.code}</span>
              </span>
              <span className="language-option-mark" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <span className="language-menu-status sr-only" aria-live="polite">
        {isSwitching ? t('language.switching') : ''}
      </span>
    </div>
  );
}
