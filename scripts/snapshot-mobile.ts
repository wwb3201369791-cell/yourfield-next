import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { chromium, type ConsoleMessage, type Page } from 'playwright';

type SnapshotTarget = Readonly<{
  name: string;
  path: string;
}>;

const defaultBaseUrl = 'http://localhost:3000';
const { values } = parseArgs({
  options: {
    'base-url': { type: 'string' },
    locale: { type: 'string' },
  },
});
const baseUrl = (values['base-url'] ?? defaultBaseUrl).replace(/\/$/, '');
const locale = values.locale ?? 'zh';
const outputDir = path.resolve('tests/snapshots/p1-mobile');

const targets: readonly SnapshotTarget[] = [
  { name: 'home', path: '' },
  { name: 'about', path: '/about' },
  { name: 'products', path: '/products' },
  { name: 'product-detail', path: '/products/firefighter-suit-combat' },
  { name: 'solutions', path: '/solutions' },
  { name: 'news', path: '/news' },
  { name: 'news-detail', path: '/news/may-day-safety-inspection' },
  { name: 'franchise', path: '/franchise' },
  { name: 'contact', path: '/contact' },
];

const relevantConsoleTypes = new Set(['error', 'warning']);

function targetUrl(targetPath: string) {
  return `${baseUrl}/${locale}${targetPath}`;
}

function formatConsoleMessage(message: ConsoleMessage) {
  return `${message.type()}: ${message.text()}`;
}

async function assertRenderedPage(page: Page, target: SnapshotTarget) {
  const status = await page.goto(targetUrl(target.path), {
    waitUntil: 'networkidle',
  });

  if (!status?.ok()) {
    throw new Error(`${target.name} returned ${status?.status() ?? 'no response'}`);
  }

  const bodyTextLength = await page
    .locator('body')
    .innerText()
    .then((text) => text.trim().length);

  if (bodyTextLength < 30) {
    throw new Error(`${target.name} rendered too little visible text`);
  }

  const frameworkOverlayCount = await page
    .locator('nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast]')
    .count();

  if (frameworkOverlayCount > 0) {
    throw new Error(`${target.name} shows a Next.js overlay`);
  }

  const hasHorizontalOverflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const tolerance = 1;

    return (
      documentElement.scrollWidth > viewportWidth + tolerance ||
      body.scrollWidth > viewportWidth + tolerance
    );
  });

  if (hasHorizontalOverflow) {
    throw new Error(`${target.name} has horizontal overflow at 375px`);
  }
}

async function captureMobileNav(page: Page) {
  await page.goto(targetUrl('/products'), { waitUntil: 'networkidle' });

  const menuButton = page.locator('.mobile-menu-btn');
  await menuButton.click();

  if ((await menuButton.getAttribute('aria-expanded')) !== 'true') {
    throw new Error('mobile menu button did not enter expanded state');
  }

  await page.screenshot({
    path: path.join(outputDir, '10-nav-open.png'),
  });

  const productsItem = page.locator('li.dropdown', {
    has: page.locator('a[data-nav="products"]'),
  });
  const productsToggle = productsItem.locator('.dropdown-toggle');
  await productsToggle.click();

  if ((await productsToggle.getAttribute('aria-expanded')) !== 'true') {
    throw new Error('products dropdown did not enter expanded state');
  }

  await page.screenshot({
    path: path.join(outputDir, '11-nav-products-expanded.png'),
  });

  await productsItem.locator('.dropdown-menu a').first().click();
  await page.waitForTimeout(250);

  if ((await menuButton.getAttribute('aria-expanded')) !== 'false') {
    throw new Error('mobile menu did not close after selecting a submenu link');
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const consoleMessages: string[] = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
  });
  const page = await context.newPage();

  page.on('console', (message) => {
    if (relevantConsoleTypes.has(message.type())) {
      consoleMessages.push(formatConsoleMessage(message));
    }
  });

  try {
    for (const [index, target] of targets.entries()) {
      await assertRenderedPage(page, target);
      await page.screenshot({
        path: path.join(outputDir, `${String(index + 1).padStart(2, '0')}-${target.name}.png`),
      });
    }

    await captureMobileNav(page);
  } finally {
    await browser.close();
  }

  if (consoleMessages.length > 0) {
    throw new Error(`browser console reported warnings/errors:\n${consoleMessages.join('\n')}`);
  }

  console.log(
    `Captured ${targets.length} mobile page snapshots and 2 nav states in ${path.relative(
      process.cwd(),
      outputDir,
    )}`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
