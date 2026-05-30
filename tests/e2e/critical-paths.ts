import assert from 'node:assert/strict';
import process from 'node:process';

import { chromium, type Browser, type ConsoleMessage, type Page } from 'playwright';

import { appUrl, localeLabels, publicVideoPaths, publicVideoUrls } from '../fixtures/publicAssets';

const baseUrl = (
  process.env.E2E_BASE_URL ??
  process.env.BASE_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');
const trackedVideoFragments = Object.values(publicVideoPaths);
const relevantConsoleTypes = new Set(['error', 'warning']);

type ScenarioDiagnostics = {
  assetFailures: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  pageErrors: string[];
};

type SearchResponseFixture = {
  ok: true;
  category?: string;
  empty?: never;
  facets: {
    categories: Record<string, number>;
    types: {
      faq: number;
      news: number;
      page: number;
      product: number;
    };
  };
  hits: Array<{
    category: {
      id: string;
      name: string;
    };
    excerpt: string;
    id: string;
    image: string;
    model: string;
    productId: string;
    publishedAt: string;
    score: number;
    sku: string;
    title: string;
    type: 'product';
    url: string;
  }>;
  locale: 'zh';
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    hitsPerPage: number;
    page: number;
    totalPages: number;
  };
  query: string;
  tookMs: number;
  totalHits: number;
  type: 'all';
};

function formatConsoleMessage(message: ConsoleMessage) {
  return `${message.type()}: ${message.text()}`;
}

function isTrackedVideoAsset(url: string) {
  return trackedVideoFragments.some((fragment) => url.includes(fragment));
}

function errorToString(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

function diagnosticsMessage(name: string, failure: unknown, diagnostics: ScenarioDiagnostics) {
  const lines = [`[${name}] failed`];

  if (failure) {
    lines.push(errorToString(failure));
  }

  if (diagnostics.pageErrors.length > 0) {
    lines.push(`page errors:\n${diagnostics.pageErrors.join('\n')}`);
  }

  if (diagnostics.consoleErrors.length > 0) {
    lines.push(`console errors:\n${diagnostics.consoleErrors.join('\n')}`);
  }

  if (diagnostics.assetFailures.length > 0) {
    lines.push(`asset failures:\n${diagnostics.assetFailures.join('\n')}`);
  }

  return lines.join('\n\n');
}

async function runScenario(
  browser: Browser,
  name: string,
  scenario: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const diagnostics: ScenarioDiagnostics = {
    assetFailures: [],
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
  };
  let failure: unknown = null;

  page.on('console', (message) => {
    if (!relevantConsoleTypes.has(message.type())) {
      return;
    }

    const formatted = formatConsoleMessage(message);

    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(formatted);
      return;
    }

    diagnostics.consoleWarnings.push(formatted);
  });

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  page.on('response', (response) => {
    if (response.status() >= 400 && isTrackedVideoAsset(response.url())) {
      diagnostics.assetFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await scenario(page);
  } catch (error) {
    failure = error;
  } finally {
    await context.close();
  }

  const hasBlockingDiagnostics =
    diagnostics.assetFailures.length > 0 ||
    diagnostics.consoleErrors.length > 0 ||
    diagnostics.pageErrors.length > 0;

  if (failure || hasBlockingDiagnostics) {
    throw new Error(diagnosticsMessage(name, failure, diagnostics));
  }

  if (diagnostics.consoleWarnings.length > 0) {
    console.warn(`[${name}] browser warnings:\n${diagnostics.consoleWarnings.join('\n')}`);
  }
}

function buildSearchResponse(query: string): SearchResponseFixture {
  return {
    ok: true,
    facets: {
      categories: {
        'fire-rescue': 1,
      },
      types: {
        faq: 0,
        news: 0,
        page: 0,
        product: 1,
      },
    },
    hits: [
      {
        category: {
          id: 'fire-rescue',
          name: '消防救援',
        },
        excerpt: '适用于消防救援与复杂环境的产品测试结果。',
        id: 'firefighter-suit-combat',
        image: '/media/firefighter-suit-combat-001.png',
        model: 'YF-FS-01',
        productId: 'firefighter-suit-combat',
        publishedAt: '2026-05-01T00:00:00.000Z',
        score: 98,
        sku: 'YF-FS-01',
        title: '消防战斗服',
        type: 'product',
        url: '/zh/products/firefighter-suit-combat',
      },
    ],
    locale: 'zh',
    pagination: {
      hasNextPage: false,
      hasPreviousPage: false,
      hitsPerPage: 8,
      page: 1,
      totalPages: 1,
    },
    query,
    tookMs: 12,
    totalHits: 1,
    type: 'all',
  };
}

async function mockSearchApi(page: Page) {
  await page.route('**/api/search**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith('/click')) {
      await route.fulfill({
        body: JSON.stringify({ ok: true }),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    if (url.pathname.endsWith('/suggest')) {
      const query = url.searchParams.get('q') ?? '';

      await route.fulfill({
        body: JSON.stringify({
          ok: true,
          locale: 'zh',
          query,
          suggestions: [{ term: query || '消防', type: 'query' }],
        }),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify(buildSearchResponse(url.searchParams.get('q') ?? '消防')),
      contentType: 'application/json',
      status: 200,
    });
  });
}

async function mockContactFormApi(page: Page) {
  await page.route('**/api/forms/submit**', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ ok: true, id: 'lead-1' }),
      contentType: 'application/json',
      status: 201,
    });
  });

  await page.route('**/turnstile/v0/api.js**', async (route) => {
    await route.fulfill({
      body: `
        window.turnstile = {
          render(element) {
            const form = element.closest('form');
            if (form && !form.querySelector('input[name="cf-turnstile-response"]')) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'cf-turnstile-response';
              input.value = 'test-token';
              form.appendChild(input);
            }
            return 'test-widget';
          },
          reset() {}
        };
        document.querySelectorAll('.cf-turnstile').forEach((element) => {
          window.turnstile.render(element);
        });
      `,
      contentType: 'application/javascript',
      status: 200,
    });
  });
}

async function ensureTurnstileToken(page: Page) {
  if ((await page.locator('.cf-turnstile').count()) === 0) {
    return;
  }

  await page.evaluate(() => {
    const form = document.querySelector('form');

    if (!form || form.querySelector('input[name="cf-turnstile-response"]')) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'cf-turnstile-response';
    input.value = 'test-token';
    form.appendChild(input);
  });
}

async function openLanguageMenu(page: Page) {
  const trigger = page.locator('[data-language-trigger]').first();

  await trigger.waitFor({ state: 'visible' });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await trigger.click();

    if ((await trigger.getAttribute('aria-expanded')) === 'true') {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error('Language menu did not open');
}

async function verifyHomeAndLanguageSwitch(page: Page) {
  await page.goto(appUrl(baseUrl, 'zh'), { waitUntil: 'domcontentloaded' });
  await page.locator('section.home-hero').waitFor({ state: 'visible' });

  const loopSource = page.locator('section.home-hero video source').first();
  await loopSource.waitFor({ state: 'attached' });

  assert.equal(await loopSource.getAttribute('src'), publicVideoUrls.homeLoop);
  assert.equal(
    await page.locator('section.home-hero video').first().getAttribute('poster'),
    '/images/home/franchise-campus-hero-clean-hd.jpg',
  );

  await openLanguageMenu(page);
  await page.getByRole('option', { name: new RegExp(localeLabels.en) }).click();
  await page.waitForURL((url) => url.pathname === '/en' || url.pathname === '/en/');

  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
}

async function verifyProducts(page: Page) {
  await page.goto(appUrl(baseUrl, 'zh', '/products'), { waitUntil: 'domcontentloaded' });

  const catalog = page.locator('[data-product-catalog]');
  await catalog.waitFor({ state: 'visible' });

  assert.ok((await catalog.locator('article').count()) > 0, 'product catalog rendered no cards');

  const productLinks = catalog.locator('a[href^="/zh/products/"]');
  assert.ok((await productLinks.count()) > 0, 'product catalog rendered no product detail links');

  await productLinks.first().click();
  await page.waitForURL(
    (url) => url.pathname.startsWith('/zh/products/') && url.pathname !== '/zh/products/',
  );

  assert.ok((await page.locator('h1').first().innerText()).trim().length > 0);
}

async function verifySearch(page: Page) {
  await mockSearchApi(page);
  await page.goto(appUrl(baseUrl, 'zh', '/search?q=消防'), { waitUntil: 'domcontentloaded' });

  await page.getByRole('heading', { name: '消防战斗服' }).waitFor({ state: 'visible' });
  await page
    .getByRole('link', { name: /消防战斗服/ })
    .first()
    .click();
  await page.waitForURL((url) => url.pathname === '/zh/products/firefighter-suit-combat');
}

async function verifyContactForm(page: Page) {
  await mockContactFormApi(page);
  await page.goto(appUrl(baseUrl, 'zh', '/contact'), { waitUntil: 'domcontentloaded' });

  const form = page.locator('form.contact-form');
  await form.waitFor({ state: 'visible' });
  await ensureTurnstileToken(page);

  await form.locator('input[name="name"]').fill('Codex 自动化测试');
  await form.locator('input[name="company"]').fill('永霏网站项目');
  await form.locator('input[name="email"]').fill('codex@example.com');
  await form.locator('input[name="mobile"]').fill('13800000000');
  await form.locator('input[name="country"]').fill('中国');
  await form.locator('textarea[name="message"]').fill('这是一条端到端测试提交。');
  await form.locator('input[name="consentAccepted"]').check();

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/forms/submit') &&
        response.request().method() === 'POST' &&
        response.status() === 201,
    ),
    form.locator('button[type="submit"]').click(),
  ]);

  await form.getByRole('status').waitFor({ state: 'visible' });

  assert.equal(await form.locator('input[name="name"]').inputValue(), '');
}

async function main() {
  const browser = await chromium.launch();

  try {
    await runScenario(browser, 'home-and-language', verifyHomeAndLanguageSwitch);
    await runScenario(browser, 'products', verifyProducts);
    await runScenario(browser, 'search', verifySearch);
    await runScenario(browser, 'contact-form', verifyContactForm);
  } finally {
    await browser.close();
  }

  console.log(`E2E critical paths OK: ${baseUrl}`);
}

void main().catch((error: unknown) => {
  console.error(errorToString(error));
  process.exitCode = 1;
});
