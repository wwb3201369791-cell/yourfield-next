import { cookies, draftMode } from 'next/headers';

export function isDraftModeEnabled() {
  // draftMode().isEnabled is a read-only getter; cookies() makes the page request-aware.
  void cookies().get('__prerender_bypass');

  return draftMode().isEnabled;
}
