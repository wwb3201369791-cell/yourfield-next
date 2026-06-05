export {};

const defaultBaseUrl = 'https://yourfieldsafety.com';
const defaultPaths = ['/zh', '/en', '/ru', '/zh/products', '/zh/news'];

const baseUrl = (process.env.MEDIA_SMOKE_BASE_URL || process.argv[2] || defaultBaseUrl).replace(
  /\/+$/,
  '',
);
const paths = (process.env.MEDIA_SMOKE_PATHS || defaultPaths.join(','))
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);

const userAgent = 'yourfield-media-smoke/1.0';
const retryDelayMs = 750;

type ImageCandidate = Readonly<{
  pagePath: string;
  url: string;
}>;

type MediaFailure = Readonly<{
  reason: string;
  status?: number;
  type?: string | null;
  url: string;
  pagePath: string;
}>;

function decodeAttribute(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function firstSrcsetUrl(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .find(Boolean);
}

function normalizeImageUrl(rawValue: string, pageUrl: string) {
  const decoded = decodeAttribute(rawValue.trim());
  const first = decoded.includes(',') ? firstSrcsetUrl(decoded) : decoded;

  if (!first || first.startsWith('data:') || first.startsWith('blob:')) {
    return null;
  }

  try {
    return new URL(first, pageUrl).toString();
  } catch {
    return null;
  }
}

function extractImageCandidates(html: string, pagePath: string): ImageCandidate[] {
  const pageUrl = `${baseUrl}${pagePath}`;
  const candidates = new Map<string, ImageCandidate>();
  const attributePattern = /\s(?:src|srcset)=(['"])(.*?)\1/gi;
  const imageLikePattern = /<(?:img|source)\b[^>]*>/gi;
  const imageTags = html.match(imageLikePattern) ?? [];

  for (const tag of imageTags) {
    for (const match of Array.from(tag.matchAll(attributePattern))) {
      const normalizedUrl = normalizeImageUrl(match[2] ?? '', pageUrl);

      if (normalizedUrl && new URL(normalizedUrl).origin === new URL(baseUrl).origin) {
        candidates.set(normalizedUrl, { pagePath, url: normalizedUrl });
      }
    }
  }

  return Array.from(candidates.values());
}

function hasImageSignature(bytes: Uint8Array) {
  const text = Buffer.from(bytes.slice(0, 128)).toString('utf8');

  if (text.startsWith('version https://git-lfs.github.com/spec/v1')) {
    return false;
  }

  return (
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) ||
    (bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50) ||
    (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)
  );
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { 'user-agent': userAgent },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkImageOnce(candidate: ImageCandidate): Promise<MediaFailure | null> {
  try {
    const response = await fetch(candidate.url, {
      headers: {
        range: 'bytes=0-255',
        'user-agent': userAgent,
      },
      redirect: 'follow',
    });
    const contentType = response.headers.get('content-type');

    if (!response.ok && response.status !== 206) {
      return {
        pagePath: candidate.pagePath,
        reason: 'HTTP status is not OK',
        status: response.status,
        type: contentType,
        url: candidate.url,
      };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const isImageType = Boolean(contentType && /^(image|video)\//i.test(contentType));

    if (!isImageType || !hasImageSignature(bytes)) {
      return {
        pagePath: candidate.pagePath,
        reason: 'response is not a valid image/video payload or is a Git LFS pointer',
        status: response.status,
        type: contentType,
        url: candidate.url,
      };
    }

    return null;
  } catch (error) {
    return {
      pagePath: candidate.pagePath,
      reason: error instanceof Error ? error.message : 'request failed',
      url: candidate.url,
    };
  }
}

async function checkImage(candidate: ImageCandidate): Promise<MediaFailure | null> {
  let lastFailure: MediaFailure | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const failure = await checkImageOnce(candidate);

    if (!failure) {
      return null;
    }

    lastFailure = failure;

    if (failure.status && failure.status >= 400 && failure.status < 500) {
      return failure;
    }

    if (attempt < 3) {
      await sleep(retryDelayMs * attempt);
    }
  }

  return lastFailure;
}

async function main() {
  const candidates = new Map<string, ImageCandidate>();

  for (const pagePath of paths) {
    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    const html = await fetchText(`${baseUrl}${normalizedPath}`);

    for (const candidate of extractImageCandidates(html, normalizedPath)) {
      candidates.set(candidate.url, candidate);
    }
  }

  const failures: MediaFailure[] = [];

  for (const candidate of Array.from(candidates.values())) {
    const failure = await checkImage(candidate);

    if (failure) {
      failures.push(failure);
    }
  }

  const summary = {
    baseUrl,
    checkedImages: candidates.size,
    failures: failures.length,
    pages: paths,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(
        `${failure.pagePath} ${failure.url} :: ${failure.reason} (${failure.status ?? 'n/a'} ${failure.type ?? 'unknown'})`,
      );
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
