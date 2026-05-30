import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadPayloadClient(nextPhase?: string) {
  vi.resetModules();

  const payload = { id: 'payload-client' };
  const getPayload = vi.fn(() => Promise.resolve(payload));
  const config = { collections: [] };

  vi.doMock('payload', () => ({ getPayload }));
  vi.doMock('@/payload.config', () => ({ default: config }));
  vi.doMock('@/lib/env', () => ({
    env: {
      NEXT_PHASE: nextPhase,
    },
  }));

  const cmsPayloadModule = await import('@/lib/cms/payload');

  return { cmsPayloadModule, config, getPayload, payload };
}

afterEach(() => {
  vi.doUnmock('payload');
  vi.doUnmock('@/payload.config');
  vi.doUnmock('@/lib/env');
  vi.resetModules();
});

describe('CMS Payload client initialization', () => {
  it('creates the Payload 3 local API client from the shared config', async () => {
    const { cmsPayloadModule, config, getPayload, payload } =
      await loadPayloadClient('phase-production-build');

    await expect(cmsPayloadModule.getPayloadClient()).resolves.toBe(payload);

    expect(getPayload).toHaveBeenCalledWith({ config });
  });

  it('reuses a single Payload client promise per module instance', async () => {
    const { cmsPayloadModule, getPayload, payload } = await loadPayloadClient();

    await expect(cmsPayloadModule.getPayloadClient()).resolves.toBe(payload);
    await expect(cmsPayloadModule.getPayloadClient()).resolves.toBe(payload);

    expect(getPayload).toHaveBeenCalledTimes(1);
  });
});
