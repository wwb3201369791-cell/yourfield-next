export type PayloadArrayRow = Record<string, unknown>;

export type ResolvePayloadFieldArrayRowsOptions = Readonly<{
  fieldValue: unknown;
  hasLocalOverride: boolean;
  reducedValue: unknown;
}>;

export function valueAtPath(value: unknown, path: string): unknown {
  if (!path) {
    return value;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

export function resolvePayloadFieldArrayRows<T extends PayloadArrayRow = PayloadArrayRow>({
  fieldValue,
  hasLocalOverride,
  reducedValue,
}: ResolvePayloadFieldArrayRowsOptions): T[] {
  if (hasLocalOverride) {
    return Array.isArray(fieldValue) ? (fieldValue as T[]) : [];
  }

  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    return fieldValue as T[];
  }

  if (Array.isArray(reducedValue) && reducedValue.length > 0) {
    return reducedValue as T[];
  }

  return Array.isArray(fieldValue) ? (fieldValue as T[]) : [];
}
