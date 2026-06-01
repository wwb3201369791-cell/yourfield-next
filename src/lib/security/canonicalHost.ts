function normalizeHost(value: string | null | undefined) {
  const host = (value ?? '').trim().toLowerCase();

  if (!host) {
    return '';
  }

  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    return end === -1 ? host : host.slice(1, end);
  }

  return host.split(':')[0] ?? host;
}

export function canonicalHostFromSiteUrl(siteUrl: string | undefined) {
  if (!siteUrl) {
    return '';
  }

  try {
    return normalizeHost(new URL(siteUrl).host);
  } catch {
    return '';
  }
}

export function shouldRedirectToCanonicalHost(args: {
  canonicalHost: string;
  nodeEnv: string | undefined;
  requestHost: string | null | undefined;
}) {
  if (args.nodeEnv !== 'production') {
    return false;
  }

  const canonicalHost = normalizeHost(args.canonicalHost);
  const requestHost = normalizeHost(args.requestHost);

  return Boolean(canonicalHost && requestHost && requestHost !== canonicalHost);
}

export function canonicalRedirectUrlForRequest(args: {
  canonicalSiteUrl: string;
  requestUrl: string;
}) {
  try {
    const target = new URL(args.requestUrl);
    const canonical = new URL(args.canonicalSiteUrl);

    target.protocol = canonical.protocol;
    target.hostname = canonical.hostname;
    target.port = canonical.port;

    return target.toString();
  } catch {
    return '';
  }
}
