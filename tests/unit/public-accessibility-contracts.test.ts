import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function relativeLuminance(hexColor: string) {
  const channels = hexColor
    .replace(/^#/, '')
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];

  const [red, green, blue] = channels;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLum = relativeLuminance(foreground);
  const backgroundLum = relativeLuminance(background);
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);

  return (lighter + 0.05) / (darker + 0.05);
}

function cssVariable(css: string, name: string) {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));

  return match?.[1];
}

describe('public accessibility contrast contracts', () => {
  it('keeps the global accent color WCAG AA readable for buttons and section tags', () => {
    const variablesCss = readFileSync('src/styles/variables.css', 'utf8');
    const accent = cssVariable(variablesCss, '--accent');

    expect(accent).toBeDefined();
    expect(contrastRatio(accent!, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', accent!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(accent!, '#f8f9fa')).toBeGreaterThanOrEqual(4.5);
  });

  it('does not introduce skipped heading levels in the shared footer chrome', () => {
    const footerSource = readFileSync('src/components/footer/Footer.tsx', 'utf8');

    expect(footerSource).not.toContain('<h4');
    expect(footerSource).toContain('footer-links__title');
    expect(footerSource).toContain('footer-contact-card__title');
  });
});
