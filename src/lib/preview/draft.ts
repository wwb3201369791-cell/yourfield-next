import { cookies, draftMode } from 'next/headers';

export async function isDraftModeEnabled() {
  // draftMode().isEnabled is a read-only getter; cookies() makes the page request-aware.
  void (await cookies()).get('__prerender_bypass');

  return (await draftMode()).isEnabled;
}
