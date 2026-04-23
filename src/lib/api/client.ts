/**
 * Single fetch-backed HTTP client. Every API call goes through this module:
 *
 *   - Base URL = `config.apiBaseUrl`
 *   - Bearer header = current session token, when one exists
 *   - 4xx / 5xx bodies (`{detail: {code}}`) → `ApiError`
 *   - Non-envelope error bodies → `ApiError` with synthetic code
 *
 * No axios, ky, or wrapper libraries. Native `fetch` is enough.
 */

import { config } from '@/core/config';

import { ApiError } from './error';
import { readSession } from './session';

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  query?: Query;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  anonymous?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function buildHeaders(options: RequestOptions, hasBody: boolean): Headers {
  const headers = new Headers(options.headers);
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  if (!options.anonymous) {
    const session = readSession();
    if (session) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }
  return headers;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<T> {
  const url = buildUrl(path, options.query);
  const hasBody = body !== undefined && method !== 'GET';
  const res = await fetch(url, {
    method,
    headers: buildHeaders(options, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed: unknown = text ? safeParse(text) : undefined;

  if (!res.ok) {
    const code = extractCode(parsed) ?? `http:${res.status}`;
    throw new ApiError(res.status, code, `${method} ${path} failed`);
  }

  return (parsed ?? undefined) as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractCode(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const detail = (parsed as { detail?: unknown }).detail;
  if (!detail || typeof detail !== 'object') return null;
  const code = (detail as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('GET', path, undefined, options);
}

export function apiPost<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>('POST', path, body, options);
}

export function apiPatch<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>('PATCH', path, body, options);
}

export function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('DELETE', path, undefined, options);
}
