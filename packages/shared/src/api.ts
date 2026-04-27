import type { ApiErrorShape } from './domain';

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, string | number | boolean | null>;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorShape;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
