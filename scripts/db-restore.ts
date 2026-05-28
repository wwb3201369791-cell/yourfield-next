import { access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const environment = Reflect.get(process, 'env') as Record<string, string | undefined>;
const defaultDatabaseUri = 'postgresql://postgres:password@localhost:5432/yourfield_dev';

function readString(value: string | boolean | string[] | boolean[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

function parseDatabaseUri(databaseUri: string) {
  try {
    const parsedUri = new URL(databaseUri);

    if (parsedUri.protocol !== 'postgresql:' && parsedUri.protocol !== 'postgres:') {
      throw new Error('Database URI must use postgresql:// or postgres://.');
    }

    return parsedUri;
  } catch (error) {
    throw new Error(
      error instanceof Error ? `Invalid DATABASE_URI: ${error.message}` : 'Invalid DATABASE_URI.',
    );
  }
}

function redactDatabaseUri(databaseUri: string) {
  const parsedUri = parseDatabaseUri(databaseUri);

  if (parsedUri.username) {
    parsedUri.username = '***';
  }

  if (parsedUri.password) {
    parsedUri.password = '***';
  }

  return parsedUri.toString();
}

function quoteForDisplay(value: string) {
  return /^[A-Za-z0-9_./:@=-]+$/.test(value) ? value : `"${value.replaceAll('"', '\\"')}"`;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildRestoreCommand(sourcePath: string, redactedDatabaseUri: string) {
  if (sourcePath.toLowerCase().endsWith('.sql')) {
    return ['psql', '--dbname', redactedDatabaseUri, '--file', sourcePath];
  }

  return [
    'pg_restore',
    '--clean',
    '--if-exists',
    '--no-owner',
    '--dbname',
    redactedDatabaseUri,
    sourcePath,
  ];
}

async function main() {
  const { values } = parseArgs({
    options: {
      'database-uri': { type: 'string' },
      execute: { type: 'boolean' },
      from: { type: 'string' },
      'strict-file': { type: 'boolean' },
    },
  });

  if (values.execute === true) {
    throw new Error(
      'Actual restore execution is intentionally disabled in this local-safe helper. Restore only after explicit approval and a test-database rehearsal.',
    );
  }

  const sourcePathValue = readString(values.from);

  if (!sourcePathValue) {
    throw new Error('Pass --from <backup-file> to generate a restore plan.');
  }

  const databaseUri = readString(values['database-uri']) ?? environment.DATABASE_URI ?? defaultDatabaseUri;

  if (!databaseUri) {
    throw new Error('DATABASE_URI is required. Pass --database-uri or set DATABASE_URI.');
  }

  const sourcePath = path.resolve(sourcePathValue);
  const exists = await fileExists(sourcePath);

  if (!exists && values['strict-file'] === true) {
    throw new Error(`Backup file was not found: ${sourcePath}`);
  }

  const redactedDatabaseUri = redactDatabaseUri(databaseUri);
  const restoreCommand = buildRestoreCommand(sourcePath, redactedDatabaseUri);

  console.log('mode: dry-run');
  console.log(`source: ${sourcePath}`);
  console.log(`sourceExists: ${exists ? 'yes' : 'no'}`);
  console.log(`database: ${redactedDatabaseUri}`);
  console.log(`command: ${restoreCommand.map(quoteForDisplay).join(' ')}`);
  console.log('dry-run complete: restore was not executed.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
