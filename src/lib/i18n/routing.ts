import { defineRouting } from 'next-intl/routing';

import { defaultLocale, locales } from './locale';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
  localeCookie: {
    name: 'yourfield.locale',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
});
