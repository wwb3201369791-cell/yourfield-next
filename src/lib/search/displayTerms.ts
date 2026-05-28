const chineseTextPattern = /[\u3400-\u9fff]/u;
const asciiLetterPattern = /[A-Za-z]/u;
const meaningfulSearchCharacterPattern = /[\p{L}\p{N}]/u;
const internalOrTestPattern =
  /(?:^|[\s._/-])(?:asdf|demo|dummy|lorem|no[-_\s]?(?:match|resul|result)|not[-_\s]?found|null|qwer|sample|test|testing|undefined|xxxx|zzzz)(?:$|[\s._/-])/iu;
const urlOrPathLikePattern = /(?:https?:\/\/|www\.|localhost|\/api\/|payload-api|[?&][\w-]+=|@)/iu;

export function compactDisplaySearchTerm(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function hasChineseSearchText(value: unknown) {
  return chineseTextPattern.test(compactDisplaySearchTerm(value));
}

function isInternalOrTestTerm(term: string) {
  return internalOrTestPattern.test(term) || urlOrPathLikePattern.test(term);
}

export function isDisplayableOperationalSearchTerm(value: unknown) {
  const term = compactDisplaySearchTerm(value);

  return Boolean(term && meaningfulSearchCharacterPattern.test(term) && !isInternalOrTestTerm(term));
}

export function isDisplayableChineseSearchTerm(value: unknown) {
  const term = compactDisplaySearchTerm(value);

  return Boolean(
    term &&
    hasChineseSearchText(term) &&
    !asciiLetterPattern.test(term) &&
    !isInternalOrTestTerm(term),
  );
}

export function isDisplayableHotSearchTerm(
  value: unknown,
  options: Readonly<{ locale?: string }> = {},
) {
  const term = compactDisplaySearchTerm(value);

  if (!term || isInternalOrTestTerm(term)) {
    return false;
  }

  return options.locale === 'zh' ? isDisplayableChineseSearchTerm(term) : true;
}
