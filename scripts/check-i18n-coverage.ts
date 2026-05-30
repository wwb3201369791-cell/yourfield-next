import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const locales = ['zh', 'en', 'ru'] as const;
const approvedLegacyOmissions = new Set(['page.contact.introTitle']);
const messageKeySeparator = '__dot__';

type Locale = (typeof locales)[number];
type FlatMessages = Record<string, string>;

function readFlatMessages(filePath: string): FlatMessages {
  const raw = readFileSync(filePath, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a flat JSON object.`);
  }

  const messages: FlatMessages = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`${filePath} key "${key}" must be a string value.`);
    }

    if (!key || key.split('.').some((segment) => segment.length === 0)) {
      throw new Error(`${filePath} key "${key}" must use non-empty dot segments.`);
    }

    messages[key] = value;
  }

  return messages;
}

function difference(left: Set<string>, right: Set<string>) {
  return [...left].filter((key) => !right.has(key)).sort();
}

function normalizeMessageKey(key: string) {
  return key.replaceAll('.', messageKeySeparator);
}

function findInternalKeyCollisions(keys: string[]) {
  const normalizedKeys = new Map<string, string>();
  const collisions = new Set<string>();

  for (const key of keys) {
    if (key.includes(messageKeySeparator)) {
      collisions.add(`${key} contains reserved separator ${messageKeySeparator}`);
      continue;
    }

    const normalizedKey = normalizeMessageKey(key);
    const existingKey = normalizedKeys.get(normalizedKey);

    if (existingKey && existingKey !== key) {
      collisions.add(`${existingKey} conflicts with ${key}`);
    }

    normalizedKeys.set(normalizedKey, key);
  }

  return [...collisions].sort();
}

function formatList(items: string[]) {
  const preview = items.slice(0, 20).join('\n  - ');
  const suffix = items.length > 20 ? `\n  ...and ${items.length - 20} more` : '';

  return `\n  - ${preview}${suffix}`;
}

function assertNoDifferences(label: string, items: string[]) {
  if (items.length > 0) {
    throw new Error(`${label}:${formatList(items)}`);
  }
}

function loadLocaleMessages(directory: string) {
  return Object.fromEntries(
    locales.map((locale) => [locale, readFlatMessages(path.join(directory, `${locale}.json`))]),
  ) as Record<Locale, FlatMessages>;
}

function main() {
  const projectRoot = process.cwd();
  const messagesDirectory = path.join(projectRoot, 'messages');
  const legacyDirectory = path.join(projectRoot, '..', 'locales');
  const messagesByLocale = loadLocaleMessages(messagesDirectory);
  const legacyExists = locales.every((locale) =>
    existsSync(path.join(legacyDirectory, `${locale}.json`)),
  );
  const referenceLocale = 'zh';
  const referenceKeys = new Set(Object.keys(messagesByLocale[referenceLocale]));

  for (const locale of locales) {
    const localeKeys = new Set(Object.keys(messagesByLocale[locale]));
    const missing = difference(referenceKeys, localeKeys);
    const extra = difference(localeKeys, referenceKeys);
    const collisions = findInternalKeyCollisions(Object.keys(messagesByLocale[locale]));

    assertNoDifferences(`${locale} is missing keys from ${referenceLocale}`, missing);
    assertNoDifferences(`${locale} has keys not present in ${referenceLocale}`, extra);
    assertNoDifferences(`${locale} has internal key collisions`, collisions);
  }

  if (legacyExists) {
    const legacyByLocale = loadLocaleMessages(legacyDirectory);

    for (const locale of locales) {
      const messageKeys = new Set(Object.keys(messagesByLocale[locale]));
      const requiredLegacyKeys = Object.keys(legacyByLocale[locale]).filter(
        (key) => !approvedLegacyOmissions.has(key),
      );
      const missingLegacy = requiredLegacyKeys.filter((key) => !messageKeys.has(key)).sort();

      assertNoDifferences(`${locale} is missing legacy keys`, missingLegacy);
    }
  } else {
    console.warn('Legacy ../locales/*.json not found; skipped legacy key availability check.');
  }

  const keyCount = referenceKeys.size;
  const legacyNote = legacyExists ? 'legacy keys verified' : 'legacy check skipped';

  console.log(`i18n coverage OK: ${keyCount} aligned keys across zh/en/ru; ${legacyNote}.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
