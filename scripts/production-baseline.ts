import fs from 'node:fs/promises';
import { performance as nodePerformance } from 'node:perf_hooks';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium, type Response as PlaywrightResponse } from 'playwright';

type ArgValue = string | boolean | string[] | boolean[] | undefined;

type Environment = Readonly<Record<string, string | undefined>>;

type BaselineTransitionTarget = Readonly<{
  from: string;
  label: string;
  selector: string;
}>;

type ProductionBaselineConfig = Readonly<{
  baseUrl: string;
  headed: boolean;
  outputJson: string;
  outputMarkdown: string;
  paths: readonly string[];
  settleMs: number;
  timeoutMs: number;
  transitions: readonly BaselineTransitionTarget[];
  viewport: Readonly<{
    height: number;
    width: number;
  }>;
}>;

type PageBaselineMetric = Readonly<{
  cls: number | null;
  documentBytes: number;
  domContentLoadedMs: number | null;
  firstImageMs: number | null;
  firstImageUrl: string | null;
  loadMs: number | null;
  longTaskMaxMs: number | null;
  lcpMs: number | null;
  path: string;
  status: number | null;
  totalBlockingTimeMs: number | null;
  ttfbMs: number | null;
}>;

type RscResponseMetric = Readonly<{
  bytes: number;
  status: number;
  url: string;
}>;

type TransitionBaselineMetric = Readonly<{
  durationMs: number;
  from: string;
  label: string;
  rscBytes: number;
  rscResponses: readonly RscResponseMetric[];
  selector: string;
  settledMs: number;
  to: string | null;
}>;

type ProductionBaselineReport = Readonly<{
  baseUrl: string;
  generatedAt: string;
  pages: readonly PageBaselineMetric[];
  transitions: readonly TransitionBaselineMetric[];
}>;

type BrowserPerfSnapshot = Readonly<{
  cls: number | null;
  documentTransferBytes: number | null;
  domContentLoadedMs: number | null;
  firstImageMs: number | null;
  firstImageUrl: string | null;
  loadMs: number | null;
  longTaskMaxMs: number | null;
  lcpMs: number | null;
  totalBlockingTimeMs: number | null;
  ttfbMs: number | null;
}>;

export const defaultProductionBaselineBaseUrl = 'http://localhost:3100';

export const defaultProductionBaselinePaths = [
  '/zh',
  '/zh/products',
  '/zh/products/firefighter-suit-combat',
  '/zh/products/arc-flash-suit',
  '/zh/solutions',
  '/zh/news',
  '/zh/contact',
] as const;

export const defaultProductionBaselineTransitions = [
  {
    from: '/zh',
    label: 'home-to-products',
    selector: 'a[href="/zh/products"]',
  },
  {
    from: '/zh',
    label: 'home-to-first-product-detail',
    selector: 'main a[href^="/zh/products/"]',
  },
] as const;

const defaultOutputJson = '.tmp/production-baseline.json';
const defaultOutputMarkdown = '.tmp/production-baseline.md';
const defaultSettleMs = 1500;
const defaultTimeoutMs = 30_000;
const defaultViewport = { height: 900, width: 1440 } as const;

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

function normalizePath(targetPath: string) {
  const trimmedPath = targetPath.trim();

  if (!trimmedPath) {
    return undefined;
  }

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
}

function parsePathList(value: readonly string[] | string | undefined) {
  if (!value) {
    return undefined;
  }

  const values = typeof value === 'string' ? value.split(',') : [...value];
  const paths = values
    .flatMap((item) => item.split(','))
    .map(normalizePath)
    .filter((item): item is string => Boolean(item));

  return paths.length > 0 ? paths : undefined;
}

function buildUrl(baseUrl: string, targetPath: string) {
  return new URL(normalizePath(targetPath) ?? '/', baseUrl).toString();
}

function roundMetric(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value);
}

function formatMs(value: number | null) {
  return value === null ? 'n/a' : `${value}ms`;
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(2)}MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)}KB`;
  }

  return `${value}B`;
}

export function resolveProductionBaselineConfig(
  values: Record<string, ArgValue>,
  environment: Environment = process.env,
): ProductionBaselineConfig {
  const baseUrl = (
    readString(values['base-url']) ??
    environment.PROD_BASELINE_BASE_URL ??
    defaultProductionBaselineBaseUrl
  ).replace(/\/$/, '');
  const paths = parsePathList(readStringList(values.path)) ??
    parsePathList(environment.PROD_BASELINE_PATHS) ?? [...defaultProductionBaselinePaths];

  return {
    baseUrl,
    headed: values.headed === true,
    outputJson: readString(values['output-json']) ?? defaultOutputJson,
    outputMarkdown: readString(values['output-md']) ?? defaultOutputMarkdown,
    paths,
    settleMs: readPositiveInteger(
      values['settle-ms'] ?? environment.PROD_BASELINE_SETTLE_MS,
      defaultSettleMs,
      '--settle-ms / PROD_BASELINE_SETTLE_MS',
    ),
    timeoutMs: readPositiveInteger(
      values['timeout-ms'] ?? environment.PROD_BASELINE_TIMEOUT_MS,
      defaultTimeoutMs,
      '--timeout-ms / PROD_BASELINE_TIMEOUT_MS',
    ),
    transitions: defaultProductionBaselineTransitions,
    viewport: defaultViewport,
  };
}

function getInitScript() {
  return `
    (() => {
      window.__yourfieldPerf = {
        cls: 0,
        lcp: 0,
        longTaskMax: 0,
        totalBlockingTime: 0
      };

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__yourfieldPerf.lcp = entry.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__yourfieldPerf.cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__yourfieldPerf.longTaskMax = Math.max(
              window.__yourfieldPerf.longTaskMax,
              entry.duration
            );
            window.__yourfieldPerf.totalBlockingTime += Math.max(0, entry.duration - 50);
          }
        }).observe({ type: 'longtask', buffered: true });
      } catch {}
    })();
  `;
}

async function readResponseBytes(response: PlaywrightResponse | null) {
  if (!response) {
    return 0;
  }

  try {
    return (await response.body()).byteLength;
  } catch {
    const contentLength = Number.parseInt(response.headers()['content-length'] ?? '0', 10);

    return Number.isFinite(contentLength) ? contentLength : 0;
  }
}

async function readRscResponse(response: PlaywrightResponse): Promise<RscResponseMetric> {
  return {
    bytes: await readResponseBytes(response),
    status: response.status(),
    url: response.url(),
  };
}

async function measurePage(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  config: ProductionBaselineConfig,
  targetPath: string,
): Promise<PageBaselineMetric> {
  const page = await browser.newPage({ viewport: config.viewport });

  await page.addInitScript(getInitScript());

  const response = await page.goto(buildUrl(config.baseUrl, targetPath), {
    timeout: config.timeoutMs,
    waitUntil: 'load',
  });

  await page.waitForTimeout(config.settleMs);

  const browserMetrics = await page.evaluate((): BrowserPerfSnapshot => {
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const perf = (
      window as typeof window & {
        __yourfieldPerf?: {
          cls: number;
          lcp: number;
          longTaskMax: number;
          totalBlockingTime: number;
        };
      }
    ).__yourfieldPerf;
    const firstImage = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((entry) => entry.initiatorType === 'img' && entry.responseEnd > 0)
      .sort((first, second) => first.responseEnd - second.responseEnd)[0];

    return {
      cls: perf ? perf.cls : null,
      documentTransferBytes: navigation
        ? navigation.transferSize || navigation.encodedBodySize || navigation.decodedBodySize
        : null,
      domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : null,
      firstImageMs: firstImage ? firstImage.responseEnd : null,
      firstImageUrl: firstImage ? firstImage.name : null,
      loadMs: navigation ? navigation.loadEventEnd : null,
      longTaskMaxMs: perf ? perf.longTaskMax : null,
      lcpMs: perf && perf.lcp > 0 ? perf.lcp : null,
      totalBlockingTimeMs: perf ? perf.totalBlockingTime : null,
      ttfbMs: navigation ? navigation.responseStart - navigation.requestStart : null,
    };
  });

  const responseBytes = await readResponseBytes(response);
  await page.close();

  return {
    cls: browserMetrics.cls === null ? null : Number(browserMetrics.cls.toFixed(3)),
    documentBytes: responseBytes || roundMetric(browserMetrics.documentTransferBytes) || 0,
    domContentLoadedMs: roundMetric(browserMetrics.domContentLoadedMs),
    firstImageMs: roundMetric(browserMetrics.firstImageMs),
    firstImageUrl: browserMetrics.firstImageUrl,
    loadMs: roundMetric(browserMetrics.loadMs),
    longTaskMaxMs: roundMetric(browserMetrics.longTaskMaxMs),
    lcpMs: roundMetric(browserMetrics.lcpMs),
    path: normalizePath(targetPath) ?? '/',
    status: response?.status() ?? null,
    totalBlockingTimeMs: roundMetric(browserMetrics.totalBlockingTimeMs),
    ttfbMs: roundMetric(browserMetrics.ttfbMs),
  };
}

async function measureTransition(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  config: ProductionBaselineConfig,
  target: BaselineTransitionTarget,
): Promise<TransitionBaselineMetric> {
  const page = await browser.newPage({ viewport: config.viewport });
  const rscResponsePromises: Array<Promise<RscResponseMetric>> = [];

  page.on('response', (response) => {
    if (response.url().includes('_rsc=')) {
      rscResponsePromises.push(readRscResponse(response));
    }
  });

  await page.goto(buildUrl(config.baseUrl, target.from), {
    timeout: config.timeoutMs,
    waitUntil: 'load',
  });

  const locator = page.locator(target.selector).first();
  await locator.waitFor({ state: 'visible', timeout: config.timeoutMs });

  const href = await locator.getAttribute('href');
  const targetUrl = href ? new URL(href, config.baseUrl) : null;
  const startedAt = nodePerformance.now();

  await Promise.all([
    targetUrl
      ? page.waitForURL((url) => url.pathname === targetUrl.pathname, {
          timeout: config.timeoutMs,
        })
      : Promise.resolve(),
    locator.click(),
  ]);
  const urlChangeMs = Math.round(nodePerformance.now() - startedAt);
  await page.waitForTimeout(config.settleMs);
  const settledMs = Math.round(nodePerformance.now() - startedAt);

  const rscResponses = await Promise.all(rscResponsePromises);
  await page.close();

  return {
    durationMs: urlChangeMs,
    from: target.from,
    label: target.label,
    rscBytes: rscResponses.reduce((total, response) => total + response.bytes, 0),
    rscResponses,
    selector: target.selector,
    settledMs,
    to: targetUrl ? targetUrl.pathname : null,
  };
}

export function formatProductionBaselineMarkdown(report: ProductionBaselineReport) {
  const lines = [
    '# Production Performance Baseline',
    '',
    `- Generated at: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    '',
    '## Page Loads',
    '',
    '| Path | Status | TTFB | LCP | TBT approx. | Load | First image | HTML | CLS |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const page of report.pages) {
    lines.push(
      [
        page.path,
        page.status ?? 'n/a',
        formatMs(page.ttfbMs),
        formatMs(page.lcpMs),
        formatMs(page.totalBlockingTimeMs),
        formatMs(page.loadMs),
        formatMs(page.firstImageMs),
        formatBytes(page.documentBytes),
        page.cls ?? 'n/a',
      ].join(' | '),
    );
  }

  lines.push(
    '',
    '## Client Transitions',
    '',
    '| Flow | From | To | URL change | Settled sample | RSC bytes | RSC responses |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
  );

  for (const transition of report.transitions) {
    lines.push(
      [
        transition.label,
        transition.from,
        transition.to ?? 'n/a',
        formatMs(transition.durationMs),
        formatMs(transition.settledMs),
        formatBytes(transition.rscBytes),
        transition.rscResponses.length,
      ].join(' | '),
    );
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeReport(config: ProductionBaselineConfig, report: ProductionBaselineReport) {
  await fs.mkdir('.tmp', { recursive: true });
  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(config.outputMarkdown, formatProductionBaselineMarkdown(report));
}

async function main() {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string' },
      headed: { type: 'boolean' },
      'output-json': { type: 'string' },
      'output-md': { type: 'string' },
      path: { multiple: true, type: 'string' },
      'settle-ms': { type: 'string' },
      'timeout-ms': { type: 'string' },
    },
  });
  const config = resolveProductionBaselineConfig(values as Record<string, ArgValue>);
  const browser = await chromium.launch({ headless: !config.headed });

  try {
    const pages: PageBaselineMetric[] = [];
    const transitions: TransitionBaselineMetric[] = [];

    for (const targetPath of config.paths) {
      pages.push(await measurePage(browser, config, targetPath));
      console.log(
        `${targetPath} status=${pages[pages.length - 1]?.status ?? 'n/a'} ttfb=${formatMs(
          pages[pages.length - 1]?.ttfbMs ?? null,
        )} lcp=${formatMs(pages[pages.length - 1]?.lcpMs ?? null)}`,
      );
    }

    for (const transition of config.transitions) {
      transitions.push(await measureTransition(browser, config, transition));
      console.log(
        `${transition.label} duration=${formatMs(
          transitions[transitions.length - 1]?.durationMs ?? null,
        )} rsc=${formatBytes(transitions[transitions.length - 1]?.rscBytes ?? 0)}`,
      );
    }

    const report = {
      baseUrl: config.baseUrl,
      generatedAt: new Date().toISOString(),
      pages,
      transitions,
    } satisfies ProductionBaselineReport;

    await writeReport(config, report);
    console.log(`baseline written to ${config.outputJson} and ${config.outputMarkdown}`);
  } finally {
    await browser.close();
  }
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
