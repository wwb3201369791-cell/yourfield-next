import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

type CheckResult = Readonly<{
  bytes: number;
  durationMs: number;
  ok: boolean;
  path: string;
  status: number;
}>;

type Profile = 'ci' | 'local';

type ArgValue = string | boolean | string[] | boolean[] | undefined;

type PerformanceCheckConfig = Readonly<{
  baseUrl: string;
  maxBytes: number;
  paths: readonly string[];
  profile: Profile;
  thresholdMs: number;
  timeoutMs: number;
}>;

type Environment = Readonly<Record<string, string | undefined>>;

const defaultBaseUrl = 'http://localhost:3000';
const defaultPaths = ['/zh', '/en', '/ru', '/zh/products', '/zh/news', '/zh/search'] as const;
const localDefaultThresholdMs = 2500;
const ciDefaultThresholdMs = 1500;
const defaultMaxBytes = 500_000;
const defaultTimeoutMs = 5000;

function readString(value: ArgValue) {
  return typeof value === 'string' ? value : undefined;
}

function readStringList(value: ArgValue) {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
    return value;
  }

  return undefined;
}

function readPositiveInteger(
  value: ArgValue,
  fallback: number,
  label: string,
) {
  const rawValue = readString(value);

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsedValue;
}

function readEnvironmentList(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function isCiEnvironment(value: string | undefined) {
  return value === 'true' || value === '1';
}

function readProfile(value: string | undefined, environment: Environment): Profile {
  if (!value) {
    return isCiEnvironment(environment.CI) ? 'ci' : 'local';
  }

  if (value === 'ci' || value === 'local') {
    return value;
  }

  throw new Error('--profile / PERF_CHECK_PROFILE must be "local" or "ci".');
}

function normalizePath(targetPath: string) {
  return targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
}

function buildUrl(baseUrl: string, targetPath: string) {
  return new URL(normalizePath(targetPath), baseUrl).toString();
}

export async function checkPath(baseUrl: string, targetPath: string, timeoutMs: number) {
  const startedAt = performance.now();
  const response = await fetch(buildUrl(baseUrl, targetPath), {
    headers: {
      'user-agent': 'yourfield-local-performance-check',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.text();
  const durationMs = Math.round(performance.now() - startedAt);

  return {
    bytes: Buffer.byteLength(body, 'utf8'),
    durationMs,
    ok: response.ok,
    path: normalizePath(targetPath),
    status: response.status,
  } satisfies CheckResult;
}

export function formatResult(result: CheckResult, thresholdMs: number, maxBytes: number) {
  const statusOk = result.ok ? 'ok' : 'bad-status';
  const timeOk = result.durationMs <= thresholdMs ? 'ok' : 'slow';
  const sizeOk = result.bytes <= maxBytes ? 'ok' : 'large';

  return `${result.path} status=${result.status}(${statusOk}) time=${result.durationMs}ms(${timeOk}) bytes=${result.bytes}(${sizeOk})`;
}

export function redactUrlForDisplay(value: string) {
  try {
    const url = new URL(value);

    if (url.username) {
      url.username = 'redacted';
    }

    if (url.password) {
      url.password = 'redacted';
    }

    if (url.search) {
      url.search = '?redacted';
    }

    return url.toString();
  } catch {
    return value.replace(/\/\/[^/@]+@/, '//redacted@').replace(/\?.*$/, '?redacted');
  }
}

export function resolvePerformanceCheckConfig(
  values: Record<string, ArgValue>,
  environment: Environment = process.env,
): PerformanceCheckConfig {
  const profile = readProfile(readString(values.profile) ?? environment.PERF_CHECK_PROFILE, environment);
  const profileThresholdMs = profile === 'ci' ? ciDefaultThresholdMs : localDefaultThresholdMs;
  const baseUrl = (
    readString(values['base-url']) ??
    environment.PERF_CHECK_BASE_URL ??
    defaultBaseUrl
  ).replace(/\/$/, '');
  const paths = (
    readStringList(values.path) ??
    readEnvironmentList(environment.PERF_CHECK_PATHS) ??
    [...defaultPaths]
  ).map(normalizePath);

  return {
    baseUrl,
    maxBytes: readPositiveInteger(
      values['max-bytes'] ?? environment.PERF_CHECK_MAX_BYTES,
      defaultMaxBytes,
      '--max-bytes / PERF_CHECK_MAX_BYTES',
    ),
    paths,
    profile,
    thresholdMs: readPositiveInteger(
      values['threshold-ms'] ?? environment.PERF_CHECK_THRESHOLD_MS,
      profileThresholdMs,
      '--threshold-ms / PERF_CHECK_THRESHOLD_MS',
    ),
    timeoutMs: readPositiveInteger(
      values['timeout-ms'] ?? environment.PERF_CHECK_TIMEOUT_MS,
      defaultTimeoutMs,
      '--timeout-ms / PERF_CHECK_TIMEOUT_MS',
    ),
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string' },
      'dry-run': { type: 'boolean' },
      'max-bytes': { type: 'string' },
      path: { multiple: true, type: 'string' },
      profile: { type: 'string' },
      'threshold-ms': { type: 'string' },
      'timeout-ms': { type: 'string' },
    },
  });

  const config = resolvePerformanceCheckConfig(values as Record<string, ArgValue>);

  console.log(`baseUrl: ${redactUrlForDisplay(config.baseUrl)}`);
  console.log(`paths: ${config.paths.join(', ')}`);
  console.log(`profile: ${config.profile}`);
  console.log(`thresholdMs: ${config.thresholdMs}`);
  console.log(`timeoutMs: ${config.timeoutMs}`);
  console.log(`maxBytes: ${config.maxBytes}`);

  if (values['dry-run'] === true) {
    console.log('dry-run complete: no HTTP requests were sent.');
    return;
  }

  const results = await Promise.all(
    config.paths.map((targetPath) => checkPath(config.baseUrl, targetPath, config.timeoutMs)),
  );
  const failures = results.filter(
    (result) =>
      !result.ok || result.durationMs > config.thresholdMs || result.bytes > config.maxBytes,
  );

  for (const result of results) {
    console.log(formatResult(result, config.thresholdMs, config.maxBytes));
  }

  if (failures.length > 0) {
    throw new Error(`performance check failed for ${failures.length} path(s).`);
  }

  console.log(`performance check OK: ${results.length} path(s) within local thresholds.`);
}

function isMainModule() {
  return Boolean(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href);
}

if (isMainModule()) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
