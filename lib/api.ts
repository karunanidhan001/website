import type { NormalizedList, RawListResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  accessToken?: string;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path.replace(/^\//, ""), ensureTrailingSlash(API_BASE_URL));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function ensureTrailingSlash(base: string) {
  if (!base) return "/";
  return base.endsWith("/") ? base : `${base}/`;
}

interface ErrorBody {
  message?: string;
  error?: string;
  code?: string;
}

async function parseErrorBody(response: Response): Promise<ErrorBody> {
  try {
    return (await response.json()) as ErrorBody;
  } catch {
    return {};
  }
}

/**
 * Typed fetch wrapper for the WarAunty enterprise API (see docs/API_MAP.md).
 * Throws ApiError on any non-2xx response.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, accessToken, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    throw new ApiError("Network request failed", 0, "NETWORK_ERROR", cause);
  }

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);
    throw new ApiError(
      errorBody.message ?? errorBody.error ?? response.statusText,
      response.status,
      errorBody.code,
      errorBody,
    );
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};

/**
 * Enterprise list endpoints return one of two shapes depending on which backend
 * helper produced them (pagedArray() includes `total`; queryUserPrefixPage() does
 * not). This normalizes both into one shape so callers never branch on it.
 */
export function normalizeListResponse<T>(raw: RawListResponse<T>): NormalizedList<T> {
  return {
    items: raw.items,
    nextCursor: raw.nextCursor,
    pageSize: raw.pageSize,
    total: "total" in raw ? raw.total : undefined,
  };
}
