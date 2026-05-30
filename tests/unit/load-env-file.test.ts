import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadEnvFile, loadLocalEnv } from '@/lib/loadEnvFile';

const tempDirs: string[] = [];

function makeTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yourfield-env-'));
  tempDirs.push(dir);
  return dir;
}

describe('loadEnvFile', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('loads UTF-8 BOM env files without treating the first key as invalid', () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env.local');
    fs.writeFileSync(envPath, '\uFEFF# local env\nPAYLOAD_SECRET="local-secret"\nEMPTY=\n');

    const environment: Record<string, string | undefined> = {};
    loadEnvFile(envPath, environment);

    expect(environment.PAYLOAD_SECRET).toBe('local-secret');
    expect(environment.EMPTY).toBe('');
  });

  it('loads .env.local before .env and keeps existing values', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, '.env.local'), 'DATABASE_URI=postgresql://local\n');
    fs.writeFileSync(path.join(dir, '.env'), 'DATABASE_URI=postgresql://fallback\nPORT=3100\n');

    const environment: Record<string, string | undefined> = {
      PORT: '3000',
    };
    loadLocalEnv(dir, environment);

    expect(environment.DATABASE_URI).toBe('postgresql://local');
    expect(environment.PORT).toBe('3000');
  });
});
