import { spawn, type ChildProcess } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

type ArgValue = string | boolean | string[] | boolean[] | undefined;

type Environment = Readonly<Record<string, string | undefined>>;

type WarmConfig = Readonly<{
  baseUrl: string;
  paths: readonly string[];
  startupTimeoutMs: number;
  timeoutMs: number;
  warmOnly: boolean;
}>;

type WarmResult = Readonly<{
  bytes: number;
  durationMs: number;
  ok: boolean;
  path: string;
  status: number;
}>;

export const defaultWarmBaseUrl = 'http://localhost:3000';

export const defaultWarmPaths = [
  '/zh',
  '/zh/about',
  '/zh/products',
  '/zh/products/firefighter-suit-combat',
  '/zh/products/arc-flash-suit',
  '/zh/solutions',
  '/zh/news',
  '/zh/franchise',
  '/zh/contact',
] as const;

const defaultStartupTimeoutMs = 120_000;
const defaultTimeoutMs = 30_000;
const pollIntervalMs = 1000;

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

function readBoolean(value: ArgValue) {
  return value === true;
}

function readPositiveInteger(
  value: ArgValue | string | undefined,
  fallback: number,
  label: string,
) {
  const rawValue = typeof value === 'string' ? value : undefined;

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsedValue;
}

export function normalizeWarmPath(targetPath: string) {
  const trimmedPath = targetPath.trim();

  if (!trimmedPath) {
    return undefined;
  }

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
}

export function parseWarmPathList(value: readonly string[] | string | undefined) {
  if (!value) {
    return undefined;
  }

  const values = typeof value === 'string' ? value.split(',') : [...value];
  const paths = values
    .flatMap((item) => item.split(','))
    .map(normalizeWarmPath)
    .filter((item): item is string => Boolean(item));

  return paths.length > 0 ? paths : undefined;
}

export function buildWarmUrl(baseUrl: string, targetPath: string) {
  return new URL(normalizeWarmPath(targetPath) ?? '/', baseUrl).toString();
}

export function resolveWarmConfig(
  values: Record<string, ArgValue>,
  environment: Environment = process.env,
): WarmConfig {
  const baseUrl = (
    readString(values['base-url']) ??
    environment.DEV_WARM_BASE_URL ??
    defaultWarmBaseUrl
  ).replace(/\/$/, '');
  const cliPaths = parseWarmPathList(readStringList(values.path));
  const environmentPaths = parseWarmPathList(environment.DEV_WARM_PATHS);

  return {
    baseUrl,
    paths: cliPaths ?? environmentPaths ?? [...defaultWarmPaths],
    startupTimeoutMs: readPositiveInteger(
      values['startup-timeout-ms'] ?? environment.DEV_WARM_STARTUP_TIMEOUT_MS,
      defaultStartupTimeoutMs,
      '--startup-timeout-ms / DEV_WARM_STARTUP_TIMEOUT_MS',
    ),
    timeoutMs: readPositiveInteger(
      values['timeout-ms'] ?? environment.DEV_WARM_TIMEOUT_MS,
      defaultTimeoutMs,
      '--timeout-ms / DEV_WARM_TIMEOUT_MS',
    ),
    warmOnly: readBoolean(values['warm-only']),
  };
}

export async function warmPath(
  baseUrl: string,
  targetPath: string,
  timeoutMs: number,
): Promise<WarmResult> {
  const startedAt = performance.now();
  const response = await fetch(buildWarmUrl(baseUrl, targetPath), {
    headers: {
      'user-agent': 'yourfield-dev-route-warmer',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.arrayBuffer();
  const durationMs = Math.round(performance.now() - startedAt);

  return {
    bytes: body.byteLength,
    durationMs,
    ok: response.ok,
    path: normalizeWarmPath(targetPath) ?? '/',
    status: response.status,
  };
}

export function formatWarmResult(result: WarmResult) {
  const statusLabel = result.ok ? 'ok' : 'bad-status';

  return `${result.path} status=${result.status}(${statusLabel}) time=${result.durationMs}ms bytes=${result.bytes}`;
}

export async function warmRoutes(config: WarmConfig) {
  const results: WarmResult[] = [];

  for (const targetPath of config.paths) {
    const result = await warmPath(config.baseUrl, targetPath, config.timeoutMs);
    results.push(result);
    console.log(formatWarmResult(result));
  }

  return results;
}

async function waitForServer(config: WarmConfig) {
  const startedAt = performance.now();
  const probePath = config.paths[0] ?? '/zh';
  let lastError: unknown;

  while (performance.now() - startedAt < config.startupTimeoutMs) {
    try {
      const response = await fetch(buildWarmUrl(config.baseUrl, probePath), {
        headers: {
          'user-agent': 'yourfield-dev-route-warmer-probe',
        },
        signal: AbortSignal.timeout(Math.min(config.timeoutMs, 5000)),
      });

      if (response.ok || response.status < 500) {
        return;
      }

      lastError = new Error(`probe returned status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(pollIntervalMs);
  }

  throw new Error(
    `dev server was not ready within ${config.startupTimeoutMs}ms: ${
      lastError instanceof Error ? lastError.message : 'unknown error'
    }`,
  );
}

function spawnDevServer() {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  return spawn(command, ['dev'], {
    env: process.env,
    stdio: 'inherit',
  });
}

function terminateDevServer(devServer: ChildProcess | undefined) {
  if (!devServer || devServer.killed) {
    return;
  }

  devServer.kill(process.platform === 'win32' ? undefined : 'SIGTERM');
}

async function keepProcessAlive(devServer: ChildProcess) {
  if (devServer.exitCode !== null || devServer.signalCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    const stop = () => {
      terminateDevServer(devServer);
      resolve();
    };

    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    devServer.once('exit', resolve);
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string' },
      path: { multiple: true, type: 'string' },
      'startup-timeout-ms': { type: 'string' },
      'timeout-ms': { type: 'string' },
      'warm-only': { type: 'boolean' },
    },
  });

  const config = resolveWarmConfig(values as Record<string, ArgValue>);
  let devServer: ChildProcess | undefined;

  console.log(`baseUrl: ${config.baseUrl}`);
  console.log(`paths: ${config.paths.join(', ')}`);

  if (!config.warmOnly) {
    devServer = spawnDevServer();
  }

  await waitForServer(config);
  await warmRoutes(config);

  if (config.warmOnly) {
    return;
  }

  console.log('dev server is warm and still running. Press Ctrl+C to stop.');
  await keepProcessAlive(devServer as ChildProcess);
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
