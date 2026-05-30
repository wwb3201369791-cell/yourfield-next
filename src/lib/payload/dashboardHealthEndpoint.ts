import type { Endpoint } from 'payload';

import { buildDashboardHealthResponse } from '../../components/admin/dashboard/health';

import { hasPayloadAccess } from './access';

type DashboardHealthRequest = Parameters<typeof hasPayloadAccess>[0] &
  Readonly<{
    payload: {
      find: (args: Record<string, unknown>) => Promise<{ docs?: unknown[] }>;
    };
  }>;

type DashboardHealthResponse = Readonly<{
  setHeader?: (name: string, value: string) => void;
  status: (status: number) => {
    json: (body: unknown) => void;
  };
}>;

const requiredReadScopes = ['products', 'product-groups', 'news', 'form-submissions'] as const;

function sendJsonError(
  res: DashboardHealthResponse,
  status: number,
  code: string,
  message: string,
) {
  res.status(status).json({
    ok: false,
    error: { code, message },
  });
}

async function canReadDashboardHealth(req: DashboardHealthRequest) {
  const accessChecks = await Promise.all(
    requiredReadScopes.map((scope) => hasPayloadAccess(req, 'read', scope)),
  );

  return accessChecks.every(Boolean);
}

async function findDocs(
  req: DashboardHealthRequest,
  collection: string,
  where: Record<string, unknown>,
) {
  const result = await req.payload.find({
    collection,
    depth: 0,
    locale: 'all',
    overrideAccess: true,
    pagination: false,
    where,
  });

  return Array.isArray(result.docs) ? result.docs : [];
}

function hoursAgoIso(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

async function handleDashboardHealthEndpoint(
  req: DashboardHealthRequest,
  res: DashboardHealthResponse,
  adminBase: string,
) {
  res.setHeader?.('Cache-Control', 'no-store');

  if (!(await canReadDashboardHealth(req))) {
    sendJsonError(res, 403, 'FORBIDDEN', '需要管理员权限。');
    return;
  }

  const now = new Date();

  try {
    const [products, productGroups, news, overdueSubmissions] = await Promise.all([
      findDocs(req, 'products', {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            publishedAt: {
              greater_than: '1970-01-01T00:00:00.000Z',
            },
          },
        ],
      }),
      findDocs(req, 'product-groups', {
        showOnFrontend: {
          not_equals: false,
        },
      }),
      findDocs(req, 'news', {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            publishedAt: {
              greater_than_equal: hoursAgoIso(now, 24 * 30),
            },
          },
        ],
      }),
      findDocs(req, 'form-submissions', {
        and: [
          {
            status: {
              equals: 'new',
            },
          },
          {
            createdAt: {
              less_than: hoursAgoIso(now, 48),
            },
          },
        ],
      }),
    ]);

    res.status(200).json(
      buildDashboardHealthResponse({
        adminBase,
        news,
        now,
        overdueSubmissions,
        productGroups,
        products,
      }),
    );
  } catch (error) {
    console.error('[admin-dashboard] health endpoint failed', {
      error: error instanceof Error ? error.message : '未知后台健康检查错误',
    });

    sendJsonError(res, 500, 'DASHBOARD_HEALTH_FAILED', '后台健康检查暂时不可用。');
  }
}

export function createDashboardHealthEndpoint(adminBase: string): Endpoint {
  return {
    method: 'get',
    path: '/dashboard/health',
    handler: async (req) => {
      let response = Response.json(
        { ok: false, error: { code: 'NO_RESPONSE', message: 'No response generated.' } },
        { status: 500 },
      );
      const headers = new Headers();
      const res: DashboardHealthResponse = {
        setHeader: (name, value) => {
          headers.set(name, value);
        },
        status: (status) => ({
          json: (body) => {
            response = Response.json(body, { headers, status });
          },
        }),
      };

      await handleDashboardHealthEndpoint(req as DashboardHealthRequest, res, adminBase);

      return response;
    },
  };
}
