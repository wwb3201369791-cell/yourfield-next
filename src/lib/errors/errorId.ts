export type ErrorWithDigest = Error & {
  digest?: string;
};

function hashString(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function createErrorId(error: ErrorWithDigest, prefix: string) {
  const digest = typeof error.digest === 'string' ? error.digest.trim() : '';

  if (digest) {
    return digest;
  }

  const hashSource = `${error.name || 'Error'}:${error.message || 'unknown'}`;

  return `${prefix}-${hashString(hashSource)}`;
}
