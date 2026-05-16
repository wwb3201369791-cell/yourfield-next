export type MessageTree = {
  [key: string]: string;
};

export type FlatMessages = Record<string, string>;

const messageKeySeparator = '__dot__';
const legacyMustacheVariablePattern = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

export function normalizeMessageKey(key: string) {
  return key.replaceAll('.', messageKeySeparator);
}

export function normalizeMessageValue(message: string) {
  return message.replace(legacyMustacheVariablePattern, '{$1}');
}

export function createNextIntlMessages(flatMessages: FlatMessages): MessageTree {
  const messages: MessageTree = {};

  for (const [flatKey, message] of Object.entries(flatMessages)) {
    messages[normalizeMessageKey(flatKey)] = normalizeMessageValue(message);
  }

  return messages;
}
