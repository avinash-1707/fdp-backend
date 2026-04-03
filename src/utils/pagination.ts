import type { PaginationMeta } from "./apiResponse";

export interface PaginationParams {
  page: number;
  limit: number;
}

export function getPaginationParams(
  rawPage: unknown,
  rawLimit: unknown,
): PaginationParams {
  const page = Math.max(1, parseInt(String(rawPage ?? 1), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(rawLimit ?? 20), 10) || 20),
  );
  return { page, limit };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
