import type { CollectionBeforeChangeHook as BeforeChangeHook } from 'payload';

function hasPublishedAt(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function autoSetPublishedAtOnPublish(
  options: Readonly<{ now?: () => Date }> = {},
): BeforeChangeHook {
  return ({ data, originalDoc }) => {
    const incoming = data as Record<string, unknown>;
    const previous = originalDoc as Record<string, unknown> | undefined;
    const nextStatus = incoming._status ?? previous?._status;

    if (nextStatus !== 'published') {
      return incoming;
    }

    if (hasPublishedAt(incoming.publishedAt) || hasPublishedAt(previous?.publishedAt)) {
      return incoming;
    }

    return {
      ...incoming,
      publishedAt: (options.now ?? (() => new Date()))().toISOString(),
    };
  };
}
