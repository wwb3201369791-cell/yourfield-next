export const devPayloadSecret = 'dev-only-payload-secret-change-before-production';

type PayloadSecretEnv = Readonly<{
  NODE_ENV?: string | undefined;
  PAYLOAD_SECRET?: string | undefined;
}>;

export function getPayloadSecret(env: PayloadSecretEnv) {
  const configuredSecret = env.PAYLOAD_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('PAYLOAD_SECRET is required in production');
  }

  return devPayloadSecret;
}
