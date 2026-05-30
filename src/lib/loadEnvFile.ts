/* eslint-disable no-restricted-syntax -- This helper intentionally loads local env files into process.env before validation. */
import fs from 'fs';
import path from 'path';

type MutableEnvironment = Record<string, string | undefined>;

function parseEnvValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadEnvFile(filePath: string, environment: MutableEnvironment = process.env) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs
    .readFileSync(filePath, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) {
      continue;
    }

    const key = match[1];
    const rawValue = match[2];
    if (!key || rawValue === undefined) {
      continue;
    }

    environment[key] ??= parseEnvValue(rawValue);
  }
}

export function loadLocalEnv(cwd = process.cwd(), environment: MutableEnvironment = process.env) {
  loadEnvFile(path.join(cwd, '.env.local'), environment);
  loadEnvFile(path.join(cwd, '.env'), environment);
}
