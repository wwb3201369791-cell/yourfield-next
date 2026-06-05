const maxSnippetLength = 180;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (isRecord(item)) {
        return asString(item.value) || asString(item.text) || asString(item.label);
      }

      return '';
    })
    .filter((item) => item.length > 0);
}

export function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

export function richTextToPlainText(value: unknown) {
  const parts: string[] = [];

  function walk(node: unknown, depth: number) {
    if (depth > 24 || !node) {
      return;
    }

    if (typeof node === 'string') {
      parts.push(node);
      return;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        walk(child, depth + 1);
      }
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    const text = node.text;
    if (typeof text === 'string') {
      parts.push(text);
    }

    walk(node.root, depth + 1);
    walk(node.children, depth + 1);
  }

  walk(value, 0);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function collectPublicText(value: unknown) {
  const parts: string[] = [];
  const skippedKeys = new Set([
    'backgroundImage',
    'backgroundVideo',
    'cover',
    'createdAt',
    'file',
    'filename',
    'id',
    'image',
    'images',
    'mimeType',
    'ogImage',
    'updatedAt',
    'url',
    'video',
  ]);

  function walk(node: unknown, depth: number, keyHint?: string) {
    if (depth > 10 || !node) {
      return;
    }

    if (typeof node === 'string') {
      if (
        keyHint !== 'href' &&
        keyHint !== 'ctaHref' &&
        keyHint !== 'primaryHref' &&
        keyHint !== 'secondaryHref'
      ) {
        parts.push(node);
      }
      return;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        walk(child, depth + 1, keyHint);
      }
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    if ('root' in node || 'children' in node) {
      const richText = richTextToPlainText(node);
      if (richText) {
        parts.push(richText);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (skippedKeys.has(key)) {
        continue;
      }

      walk(child, depth + 1, key);
    }
  }

  walk(value, 0);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function compact(values: readonly (string | undefined)[]) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

export function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

export function normalizeCompactSearchText(value: string) {
  return normalizeSearchText(value).replace(/[^\p{L}\p{N}]+/gu, '');
}

export function normalizeKey(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, '-');
}

export function tokenizeQuery(query: string) {
  const normalized = normalizeSearchText(query);
  const words = normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
  const tokens = new Set<string>();

  if (normalized) {
    tokens.add(normalized);
  }

  for (const word of words) {
    if (word) {
      tokens.add(word);
    }
  }

  return Array.from(tokens);
}

export function truncate(value: string, maxLength = maxSnippetLength) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
