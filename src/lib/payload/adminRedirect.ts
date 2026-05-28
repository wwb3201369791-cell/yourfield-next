function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createExactAdminRedirectPattern(adminPath: string) {
  return new RegExp(`^${escapeRegExp(adminPath)}$`);
}

export function adminRedirectTarget(adminPath: string, originalUrl: string) {
  const [pathname, query = ''] = originalUrl.split('?');

  if (pathname !== adminPath) {
    return null;
  }

  return `${adminPath}/${query ? `?${query}` : ''}`;
}
