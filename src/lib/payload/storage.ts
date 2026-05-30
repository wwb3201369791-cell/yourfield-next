import { s3Storage } from '@payloadcms/storage-s3';
import type { Plugin } from 'payload';

import { env } from '../env';

type S3StorageEnv = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  publicUrlBase: string;
  region: string;
  secretAccessKey: string;
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const getS3StorageEnv = (): S3StorageEnv | null => {
  if (env.S3_ENDPOINT === undefined) {
    return null;
  }

  if (
    env.S3_REGION === undefined ||
    env.S3_BUCKET === undefined ||
    env.S3_ACCESS_KEY_ID === undefined ||
    env.S3_SECRET_ACCESS_KEY === undefined ||
    env.S3_PUBLIC_URL_BASE === undefined
  ) {
    throw new Error('S3 object storage env must be fully configured or left fully empty');
  }

  return {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    publicUrlBase: env.S3_PUBLIC_URL_BASE,
    region: env.S3_REGION,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  };
};

const s3StorageEnv = getS3StorageEnv();

export const isS3StorageEnabled = s3StorageEnv !== null;

export const generateS3PublicURL = ({
  filename,
  prefix,
}: {
  filename: string;
  prefix?: string;
}) => {
  if (s3StorageEnv === null) {
    throw new Error('S3_PUBLIC_URL_BASE is required when S3 object storage is enabled');
  }

  const publicBase = s3StorageEnv.publicUrlBase.replace(/\/+$/g, '');
  const objectPath = [prefix, filename]
    .filter((part): part is string => Boolean(part))
    .map(trimSlashes)
    .join('/');

  return `${publicBase}/${objectPath}`;
};

export const createPayloadCloudStoragePlugin = (): Plugin => {
  if (s3StorageEnv === null) {
    return (config) => config;
  }

  return s3Storage({
    enabled: true,
    bucket: s3StorageEnv.bucket,
    config: {
      credentials: {
        accessKeyId: s3StorageEnv.accessKeyId,
        secretAccessKey: s3StorageEnv.secretAccessKey,
      },
      endpoint: s3StorageEnv.endpoint,
      region: s3StorageEnv.region,
    },
    disableLocalStorage: true,
    collections: {
      media: {
        disablePayloadAccessControl: true,
        generateFileURL: generateS3PublicURL,
      },
    },
  });
};
