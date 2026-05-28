import type { ProductGroupId } from '@/lib/mock/products';

import { normalizeCmsMediaUrl, selectCmsMediaUrl } from '../media';

import { fallbackProductImage } from './constants';
import type { CmsProductImage } from './types';

export function isCmsProductGroupId(value: unknown): value is ProductGroupId {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function localizedText(value: string) {
  return {
    zh: value,
    en: value,
    ru: value,
  };
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function richTextToPlainText(value: unknown) {
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') {
      return;
    }

    const record = node as Record<string, unknown>;
    if (typeof record.text === 'string') {
      parts.push(record.text);
    }

    if (Array.isArray(record.children)) {
      record.children.forEach(walk);
    }

    if (record.root) {
      walk(record.root);
    }
  }

  walk(value);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function mediaUrl(file: CmsProductImage['file']) {
  if (!file || typeof file !== 'object') {
    return fallbackProductImage;
  }

  return normalizeCmsMediaUrl(selectCmsMediaUrl(file), fallbackProductImage);
}
