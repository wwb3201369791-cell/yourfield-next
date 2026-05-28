'use client';

type UmamiScriptProps = Readonly<{
  enabled: boolean;
  scriptUrl: string | undefined;
  websiteId: string | undefined;
}>;

export function UmamiScript({ enabled, scriptUrl, websiteId }: UmamiScriptProps) {
  void enabled;
  void scriptUrl;
  void websiteId;

  // Re-enable only with a full consent flow: accept, reject, customize, and withdrawal.
  return null;
}
