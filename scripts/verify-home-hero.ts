import process from 'node:process';

import { chromium, type ConsoleMessage } from 'playwright';

const defaultBaseUrl = 'http://localhost:3000';
// eslint-disable-next-line no-restricted-syntax -- Smoke tests need an ad hoc URL override.
const baseUrl = (process.env.HOME_HERO_BASE_URL ?? defaultBaseUrl).replace(/\/$/, '');
// eslint-disable-next-line no-restricted-syntax -- Smoke tests need an ad hoc locale override.
const locale = process.env.HOME_HERO_LOCALE ?? 'zh';
const watchFullPattern = /观看完整视频|Watch full video|Смотреть полное видео/i;
const relevantConsoleTypes = new Set(['error', 'warning']);
const heroAssetPaths = [
  '/images/home/hero-campus-video-poster',
  '/video/home/hero-campus-background-loop.mp4',
  '/video/home/hero-campus-background-original.mp4',
] as const;

const absoluteUrlPattern = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;
const schemePattern = /^[a-z][a-z\d+.-]*:/i;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function resolvePublicVideoUrl(path: string) {
  if (!path || absoluteUrlPattern.test(path) || schemePattern.test(path)) {
    return path;
  }

  const publicBase = process.env.S3_PUBLIC_URL_BASE?.trim();

  if (!publicBase) {
    return path;
  }

  return `${trimTrailingSlash(publicBase)}/${path.replace(/^\/+/, '')}`;
}

const expectedLoopVideoSrc = resolvePublicVideoUrl('/video/home/hero-campus-background-loop.mp4');
const expectedFullVideoSrc = resolvePublicVideoUrl(
  '/video/home/hero-campus-background-original.mp4',
);

function formatConsoleMessage(message: ConsoleMessage) {
  return `${message.type()}: ${message.text()}`;
}

async function main() {
  const consoleMessages: string[] = [];
  const heroAssetFailures: string[] = [];
  const pageErrors: string[] = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.route('**/hero-campus-background-original.mp4', async (route) => {
    await route.fulfill({
      body: Buffer.alloc(0),
      contentType: 'video/mp4',
      status: 200,
    });
  });

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.on('console', (message) => {
    if (relevantConsoleTypes.has(message.type())) {
      consoleMessages.push(formatConsoleMessage(message));
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(`pageerror: ${error.message}`);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400 && heroAssetPaths.some((assetPath) => url.includes(assetPath))) {
      heroAssetFailures.push(`${response.status()} ${url}`);
    }
  });

  try {
    const response = await page.goto(`${baseUrl}/${locale}`, {
      waitUntil: 'domcontentloaded',
    });

    if (!response?.ok()) {
      throw new Error(`homepage returned ${response?.status() ?? 'no response'}`);
    }

    const backgroundVideo = page.locator('section.home-hero video[autoplay][playsinline]').first();
    await backgroundVideo.waitFor({ state: 'attached', timeout: 15_000 });
    await backgroundVideo.waitFor({ state: 'visible', timeout: 10_000 });

    await page.waitForSelector('section.home-hero video source', {
      state: 'attached',
      timeout: 10_000,
    });

    const backgroundVideoState = await backgroundVideo.evaluate(async (video: HTMLVideoElement) => {
      const source = video.querySelector('source')?.getAttribute('src') ?? null;
      const firstTime = video.currentTime;

      await new Promise((resolve) => {
        setTimeout(resolve, 2500);
      });

      return {
        currentSrc: video.currentSrc,
        currentTimeChanged: Math.abs(video.currentTime - firstTime) > 0.05,
        paused: video.paused,
        poster: video.getAttribute('poster'),
        opacity: window.getComputedStyle(video).opacity,
        readyState: video.readyState,
        source,
      };
    });

    if (backgroundVideoState.source !== expectedLoopVideoSrc) {
      throw new Error(
        `unexpected background video source: ${backgroundVideoState.source ?? 'missing'}`,
      );
    }

    if (backgroundVideoState.poster !== '/images/home/franchise-campus-hero-clean-hd.jpg') {
      throw new Error(
        `unexpected background video poster: ${backgroundVideoState.poster ?? 'missing'}`,
      );
    }

    if (backgroundVideoState.paused || !backgroundVideoState.currentTimeChanged) {
      throw new Error('homepage hero background video did not autoplay');
    }

    if (Number.parseFloat(backgroundVideoState.opacity) < 0.99) {
      throw new Error('homepage hero background video should be visible on first render');
    }

    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

    await page.getByRole('button', { name: watchFullPattern }).click();
    await page.getByRole('dialog', { name: watchFullPattern }).waitFor({
      state: 'visible',
      timeout: 5000,
    });

    const modalVideoSource = await page.locator('[role="dialog"] video source').getAttribute('src');
    if (modalVideoSource !== expectedFullVideoSrc) {
      throw new Error(`unexpected full video source: ${modalVideoSource ?? 'missing'}`);
    }

    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: watchFullPattern }).waitFor({
      state: 'detached',
      timeout: 5000,
    });
  } finally {
    await browser.close();
  }

  if (pageErrors.length > 0) {
    throw new Error(`browser page errors:\n${pageErrors.join('\n')}`);
  }

  if (heroAssetFailures.length > 0) {
    throw new Error(`hero assets failed to load:\n${heroAssetFailures.join('\n')}`);
  }

  if (consoleMessages.length > 0) {
    console.warn(`non-hero console warnings/errors observed:\n${consoleMessages.join('\n')}`);
  }

  console.log(`home hero smoke OK: ${baseUrl}/${locale}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
