export type MessageTree = {
  [key: string]: string | MessageTree;
};

export function expandFlatMessages(flatMessages: Record<string, string>): MessageTree {
  const tree: MessageTree = {};

  for (const [flatKey, message] of Object.entries(flatMessages)) {
    const segments = flatKey.split('.');
    let cursor = tree;

    for (const segment of segments.slice(0, -1)) {
      const current = cursor[segment];

      if (typeof current !== 'object' || current === null) {
        cursor[segment] = {};
      }

      cursor = cursor[segment] as MessageTree;
    }

    const leafKey = segments[segments.length - 1];

    if (leafKey) {
      cursor[leafKey] = message;
    }
  }

  return tree;
}
