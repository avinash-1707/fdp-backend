export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function successResponse<T>(
  message: string,
  data?: T,
  meta?: PaginationMeta,
): ApiResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    message,
    ...(error && { error }),
  };
}
