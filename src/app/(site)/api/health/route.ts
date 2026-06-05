import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { getPayloadClient } from '@/lib/cms/payload';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HealthCheck = Readonly<{
  latencyMs: number;
  ok: boolean;
  code?: 'DATABASE_UNAVAILABLE';
}>;

const serviceName = 'yourfield-next';

function normalizeReleaseRevision(value: string | undefined) {
  const revision = value?.trim();

  return revision ? revision : null;
}

function readReleaseRevision() {
  const envRevision = normalizeReleaseRevision(env.APP_RELEASE_REVISION);

  if (envRevision) {
    return envRevision;
  }

  try {
    return normalizeReleaseRevision(readFileSync(join(process.cwd(), '.release_revision'), 'utf8'));
  } catch {
    return null;
  }
}

function releaseInfo() {
  const revision = readReleaseRevision();

  return {
    revision,
    shortRevision: revision ? revision.slice(0, 7) : null,
  };
}

async function pingDatabase(): Promise<HealthCheck> {
  const startedAt = Date.now();

  try {
    const payload = await getPayloadClient();

    await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
    });

    return {
      latencyMs: Date.now() - startedAt,
      ok: true,
    };
  } catch {
    return {
      code: 'DATABASE_UNAVAILABLE',
      latencyMs: Date.now() - startedAt,
      ok: false,
    };
  }
}

export async function GET() {
  const database = await pingDatabase();

  return NextResponse.json(
    {
      checks: {
        database,
      },
      ok: database.ok,
      release: releaseInfo(),
      service: serviceName,
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
      status: database.ok ? 200 : 503,
    },
  );
}
