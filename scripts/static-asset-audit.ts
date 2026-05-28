import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

type ArgValue = string | boolean | string[] | boolean[] | undefined;

type PublicAssetKind = 'font' | 'image' | 'other' | 'video';

type MigrationPriority = 'high' | 'low' | 'medium';

type PublicAssetRecord = Readonly<{
  bytes: number;
  extension: string;
  kind: PublicAssetKind;
  migrationBucket: string;
  migrationPriority: MigrationPriority;
  publicPath: string;
}>;

type AssetGroupSummary = Readonly<{
  bytes: number;
  files: number;
  key: string;
}>;

type StaticAssetAuditSummary = Readonly<{
  budgetBytes: number;
  migrationCandidates: readonly AssetGroupSummary[];
  overBudget: boolean;
  totalBytes: number;
  totalFiles: number;
  topDirectories: readonly AssetGroupSummary[];
  topExtensions: readonly AssetGroupSummary[];
  topFiles: readonly PublicAssetRecord[];
  topLevels: readonly AssetGroupSummary[];
}>;

type StaticAssetAuditConfig = Readonly<{
  budgetBytes: number;
  failOverBudget: boolean;
  outputJson: string;
  outputMarkdown: string;
  publicDir: string;
  topCount: number;
}>;

const defaultBudgetBytes = 500 * 1024 * 1024;
const defaultOutputMarkdown = '.tmp/static-assets-audit.md';
const defaultPublicDir = 'public';
const defaultTopCount = 25;
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const videoExtensions = new Set(['.mov', '.mp4', '.webm']);
const fontExtensions = new Set(['.otf', '.ttf', '.woff', '.woff2']);

function readString(value: ArgValue) {
  return typeof value === 'string' ? value : undefined;
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

function readBudgetBytes(value: ArgValue | string | undefined, fallback: number) {
  const rawValue = typeof value === 'string' ? value : undefined;

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseFloat(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error('--budget-mb / STATIC_ASSET_BUDGET_MB must be a positive number.');
  }

  return Math.round(parsedValue * 1024 * 1024);
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }

  return `${bytes}B`;
}

function normalizePublicPath(publicDir: string, absoluteFilePath: string) {
  const relativePath = path.relative(publicDir, absoluteFilePath);
  const normalized = relativePath.split(path.sep).join('/');

  return `/${normalized}`;
}

function groupPath(publicPath: string, depth: number) {
  const parts = publicPath.split('/').filter(Boolean).slice(0, depth);

  return parts.length > 0 ? `/${parts.join('/')}` : '/';
}

function assetKindFromExtension(extension: string): PublicAssetKind {
  if (imageExtensions.has(extension)) {
    return 'image';
  }

  if (videoExtensions.has(extension)) {
    return 'video';
  }

  if (fontExtensions.has(extension)) {
    return 'font';
  }

  return 'other';
}

export function classifyPublicAsset(
  publicPath: string,
  bytes: number,
): Pick<PublicAssetRecord, 'extension' | 'kind' | 'migrationBucket' | 'migrationPriority'> {
  const extension = path.extname(publicPath).toLowerCase() || '(none)';
  const kind = assetKindFromExtension(extension);
  const topLevel = groupPath(publicPath, 1);
  const secondLevel = groupPath(publicPath, 2);
  const migrationBucket = kind === 'video' ? topLevel : secondLevel;
  const isHighPriority =
    kind === 'video' ||
    secondLevel === '/images/products' ||
    secondLevel === '/images/about' ||
    bytes >= 5 * 1024 * 1024;

  return {
    extension,
    kind,
    migrationBucket,
    migrationPriority: isHighPriority ? 'high' : kind === 'image' ? 'medium' : 'low',
  };
}

function sortGroups(groups: Iterable<AssetGroupSummary>) {
  return [...groups].sort(
    (first, second) => second.bytes - first.bytes || first.key.localeCompare(second.key),
  );
}

function summarizeByKey(
  assets: readonly PublicAssetRecord[],
  keyForAsset: (asset: PublicAssetRecord) => string,
) {
  const groups = new Map<string, AssetGroupSummary>();

  for (const asset of assets) {
    const key = keyForAsset(asset);
    const existing = groups.get(key);

    groups.set(key, {
      bytes: (existing?.bytes ?? 0) + asset.bytes,
      files: (existing?.files ?? 0) + 1,
      key,
    });
  }

  return sortGroups(groups.values());
}

export function summarizePublicAssets(
  assets: readonly PublicAssetRecord[],
  budgetBytes = defaultBudgetBytes,
  topCount = defaultTopCount,
): StaticAssetAuditSummary {
  const totalBytes = assets.reduce((total, asset) => total + asset.bytes, 0);
  const migrationCandidates = summarizeByKey(
    assets.filter((asset) => asset.migrationPriority === 'high'),
    (asset) => asset.migrationBucket,
  );

  return {
    budgetBytes,
    migrationCandidates,
    overBudget: totalBytes > budgetBytes,
    totalBytes,
    totalFiles: assets.length,
    topDirectories: summarizeByKey(assets, (asset) => groupPath(asset.publicPath, 2)).slice(
      0,
      topCount,
    ),
    topExtensions: summarizeByKey(assets, (asset) => asset.extension).slice(0, topCount),
    topFiles: [...assets].sort((first, second) => second.bytes - first.bytes).slice(0, topCount),
    topLevels: summarizeByKey(assets, (asset) => groupPath(asset.publicPath, 1)),
  };
}

export function formatStaticAssetAuditMarkdown(summary: StaticAssetAuditSummary) {
  const lines = [
    '# Static Asset Audit',
    '',
    `- Total: ${formatBytes(summary.totalBytes)} across ${summary.totalFiles} files`,
    `- Budget: ${formatBytes(summary.budgetBytes)}`,
    `- Status: ${summary.overBudget ? 'over budget' : 'within budget'}`,
    '',
    '## Top-Level Folders',
    '',
    '| Folder | Size | Files |',
    '| --- | ---: | ---: |',
  ];

  for (const group of summary.topLevels) {
    lines.push(`| ${group.key} | ${formatBytes(group.bytes)} | ${group.files} |`);
  }

  lines.push(
    '',
    '## Migration Candidates',
    '',
    '| Bucket | Size | Files |',
    '| --- | ---: | ---: |',
  );

  for (const group of summary.migrationCandidates) {
    lines.push(`| ${group.key} | ${formatBytes(group.bytes)} | ${group.files} |`);
  }

  lines.push('', '## Largest Files', '', '| File | Size | Kind |', '| --- | ---: | --- |');

  for (const asset of summary.topFiles) {
    lines.push(`| ${asset.publicPath} | ${formatBytes(asset.bytes)} | ${asset.kind} |`);
  }

  lines.push(
    '',
    '## Largest Directories',
    '',
    '| Directory | Size | Files |',
    '| --- | ---: | ---: |',
  );

  for (const group of summary.topDirectories) {
    lines.push(`| ${group.key} | ${formatBytes(group.bytes)} | ${group.files} |`);
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function walkPublicAssets(
  publicDir: string,
  currentDir = publicDir,
): Promise<PublicAssetRecord[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const assets: PublicAssetRecord[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      assets.push(...(await walkPublicAssets(publicDir, absolutePath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const stats = await fs.stat(absolutePath);
    const publicPath = normalizePublicPath(publicDir, absolutePath);
    const classification = classifyPublicAsset(publicPath, stats.size);

    assets.push({
      bytes: stats.size,
      publicPath,
      ...classification,
    });
  }

  return assets;
}

export function resolveStaticAssetAuditConfig(
  values: Record<string, ArgValue>,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): StaticAssetAuditConfig {
  return {
    budgetBytes: readBudgetBytes(
      values['budget-mb'] ?? environment.STATIC_ASSET_BUDGET_MB,
      defaultBudgetBytes,
    ),
    failOverBudget: values['fail-over-budget'] === true,
    outputJson: readString(values['output-json']) ?? '.tmp/static-assets-audit.json',
    outputMarkdown: readString(values['output-md']) ?? defaultOutputMarkdown,
    publicDir: readString(values['public-dir']) ?? defaultPublicDir,
    topCount: readPositiveInteger(
      values.top ?? environment.STATIC_ASSET_AUDIT_TOP,
      defaultTopCount,
      '--top / STATIC_ASSET_AUDIT_TOP',
    ),
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      'budget-mb': { type: 'string' },
      'fail-over-budget': { type: 'boolean' },
      'output-json': { type: 'string' },
      'output-md': { type: 'string' },
      'public-dir': { type: 'string' },
      top: { type: 'string' },
    },
  });
  const config = resolveStaticAssetAuditConfig(values as Record<string, ArgValue>);
  const assets = await walkPublicAssets(config.publicDir);
  const summary = summarizePublicAssets(assets, config.budgetBytes, config.topCount);

  await fs.mkdir(path.dirname(config.outputJson), { recursive: true });
  await fs.mkdir(path.dirname(config.outputMarkdown), { recursive: true });
  await fs.writeFile(config.outputJson, `${JSON.stringify({ assets, summary }, null, 2)}\n`);
  await fs.writeFile(config.outputMarkdown, formatStaticAssetAuditMarkdown(summary));

  console.log(
    `static asset audit: ${formatBytes(summary.totalBytes)} across ${summary.totalFiles} files (${summary.overBudget ? 'over budget' : 'within budget'})`,
  );
  console.log(`audit written to ${config.outputJson} and ${config.outputMarkdown}`);

  if (config.failOverBudget && summary.overBudget) {
    throw new Error(
      `static assets exceed budget: ${formatBytes(summary.totalBytes)} > ${formatBytes(summary.budgetBytes)}`,
    );
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
