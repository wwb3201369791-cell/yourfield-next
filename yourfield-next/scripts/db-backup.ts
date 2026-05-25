import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

type BackupFormat = 'custom' | 'plain';

const defaultDatabaseUri = 'postgresql://postgres:password@localhost:5432/yourfield_dev';
const environment = Reflect.get(process, 'env') as Record<string, string | undefined>;

function readString(value: string | boolean | string[] | boolean[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

function isBackupFormat(value: string): value is BackupFormat {
  return value === 'custom' || value === 'plain';
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

function buildOutputPath(rawOutputPath: string | undefined, format: BackupFormat) {
  if (rawOutputPath) {
    return path.resolve(rawOutputPath);
  }

  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const extension = format === 'plain' ? 'sql' : 'dump';

  return path.resolve('backups', 'db', `yourfield-${timestamp}.${extension}`);
}

function buildPgDumpArgs(databaseUri: string, outputPath: string, format: BackupFormat) {
  return [
    '--no-owner',
    '--no-privileges',
    `--format=${format}`,
    '--file',
    outputPath,
    databaseUri,
  ];
}

function formatCommand(args: string[], redactedDatabaseUri: string) {
  const displayArgs = args.map((arg, index) =>
    index === args.length - 1 ? redactedDatabaseUri : arg,
  );

  return `pg_dump ${displayArgs.map(quoteForDisplay).join(' ')}`;
}

async function runPgDump(args: string[]) {
  const child = spawn('pg_dump', args, {
    shell: false,
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  await new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`pg_dump exited with code ${code ?? 'unknown'}.`));
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      'database-uri': { type: 'string' },
      'dry-run': { type: 'boolean' },
      execute: { type: 'boolean' },
      format: { type: 'string' },
      out: { type: 'string' },
    },
  });

  if (values.execute === true && values['dry-run'] === true) {
    throw new Error('Use either --dry-run or --execute, not both.');
  }

  const execute = values.execute === true;
  const databaseUri = readString(values['database-uri']) ?? environment.DATABASE_URI ?? defaultDatabaseUri;

  if (!databaseUri) {
    throw new Error('DATABASE_URI is required. Pass --database-uri or set DATABASE_URI.');
  }

  parseDatabaseUri(databaseUri);

  const rawFormat = readString(values.format) ?? 'custom';

  if (!isBackupFormat(rawFormat)) {
    throw new Error('Invalid --format. Use custom or plain.');
  }

  const outputPath = buildOutputPath(readString(values.out), rawFormat);
  const args = buildPgDumpArgs(databaseUri, outputPath, rawFormat);
  const redactedDatabaseUri = redactDatabaseUri(databaseUri);

  console.log(`mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`output: ${outputPath}`);
  console.log(`database: ${redactedDatabaseUri}`);
  console.log(`command: ${formatCommand(args, redactedDatabaseUri)}`);

  if (!execute) {
    console.log('dry-run complete: no database connection was opened and no file was written.');
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await runPgDump(args);
  console.log(`backup written: ${outputPath}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
