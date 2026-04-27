import { ApiClientError } from '@/lib/api';

const BACKEND_UNAVAILABLE_CODES = new Set(['NETWORK_ERROR', 'HTTP_ERROR', 'INVALID_RESPONSE']);

export const isBackendOfflineError = (error: unknown) =>
  error instanceof ApiClientError && BACKEND_UNAVAILABLE_CODES.has(error.code);
