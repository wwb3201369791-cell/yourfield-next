import type { BeforeOperationHook } from 'payload/dist/collections/config/types';
import APIError from 'payload/dist/errors/APIError';

import {
  findMediaUploadLimitViolation,
  formatMediaUploadLimit,
  type MediaUploadFile,
} from '../../media/uploadLimits';

type RequestUploadFile = Readonly<{
  mimetype?: unknown;
  size?: unknown;
}>;

function requestFileForValidation(file: RequestUploadFile | undefined) {
  let uploadFile: MediaUploadFile = {};

  if (typeof file?.mimetype === 'string') {
    uploadFile = { ...uploadFile, mimetype: file.mimetype };
  }

  if (typeof file?.size === 'number') {
    uploadFile = { ...uploadFile, size: file.size };
  }

  return uploadFile;
}

function getRequestUploadFile(req: Readonly<{ files?: unknown }>) {
  const files = req.files;

  if (!files || typeof files !== 'object' || !('file' in files)) {
    return undefined;
  }

  return (files as { file?: RequestUploadFile }).file;
}

export const enforceMediaUploadLimit: BeforeOperationHook = ({ operation, req }) => {
  if (operation !== 'create' && operation !== 'update') {
    return undefined;
  }

  const violation = findMediaUploadLimitViolation(
    requestFileForValidation(getRequestUploadFile(req)),
  );

  if (!violation) {
    return undefined;
  }

  req.payload?.logger?.warn({
    actualBytes: violation.actualBytes,
    limitBytes: violation.maxBytes,
    mediaKind: violation.kind,
    msg: 'Media upload rejected by size limit',
  });

  throw new APIError(
    `Uploaded ${violation.kind} file exceeds the ${formatMediaUploadLimit(
      violation.maxBytes,
    )} limit.`,
    413,
    { code: 'UPLOAD_TOO_LARGE' },
    true,
  );
};
