const EXTENSION_PATTERN = /\s*(?:#|ext\.?|extension|x|转)\s*\d{1,8}$/i;
const PHONE_ALLOWED_CHARS = /^[+\d\s().-]+$/;

export function isValidGlobalPhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const phoneWithoutExtension = trimmed.replace(EXTENSION_PATTERN, '').trim();
  if (!phoneWithoutExtension || !PHONE_ALLOWED_CHARS.test(phoneWithoutExtension)) {
    return false;
  }

  const plusCount = (phoneWithoutExtension.match(/\+/g) ?? []).length;
  if (plusCount > 1 || (plusCount === 1 && !phoneWithoutExtension.startsWith('+'))) {
    return false;
  }

  const digitCount = phoneWithoutExtension.replace(/\D/g, '').length;

  return digitCount >= 7 && digitCount <= 15;
}
