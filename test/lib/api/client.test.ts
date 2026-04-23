import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { apiGet, apiPost } from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { clearSession, writeSession } from '@/lib/api/session';

import { server } from '../../_mocks/server';

beforeEach(() => {
  clearSession();
});

describe('apiGet', () => {
  it('returns a parsed JSON body on 200', async () => {
    server.use(
      http.get('http://api.test/v1/markets', () =>
        HttpResponse.json([{ address: '0:aa', topic_text: 'hi' }]),
      ),
    );
    const result = await apiGet<{ address: string }[]>('/v1/markets');
    expect(result).toEqual([{ address: '0:aa', topic_text: 'hi' }]);
  });

  it('attaches Authorization header when a session is stored', async () => {
    writeSession({
      token: 'abc',
      wallet_address: '0:aa',
      telegram_id: 1,
      expires_at: '2099-01-01T00:00:00Z',
    });
    let seen = '';
    server.use(
      http.get('http://api.test/v1/markets', ({ request }) => {
        seen = request.headers.get('authorization') ?? '';
        return HttpResponse.json([]);
      }),
    );
    await apiGet('/v1/markets');
    expect(seen).toBe('Bearer abc');
  });

  it('parses error envelope into ApiError', async () => {
    server.use(
      http.get('http://api.test/v1/markets/oops', () =>
        HttpResponse.json({ detail: { code: 'market:not-found-1' } }, { status: 404 }),
      ),
    );
    const caught = await apiGet('/v1/markets/oops').catch((e: unknown) => e);
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(404);
    expect((caught as ApiError).code).toBe('market:not-found-1');
  });

  it('synthesizes a code when server returns non-envelope error', async () => {
    server.use(
      http.get('http://api.test/v1/markets/bad', () =>
        HttpResponse.json({ error: 'whoops' }, { status: 500 }),
      ),
    );
    const caught = await apiGet('/v1/markets/bad').catch((e: unknown) => e);
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(500);
    expect((caught as ApiError).code).toBe('http:500');
  });
});

describe('apiPost', () => {
  it('sends a JSON body and returns the response', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post('http://api.test/v1/markets/tx', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ to: '0:aa', amount_nano: 19_000_000_000, op: 0x10000001 });
      }),
    );
    const result = await apiPost('/v1/markets/tx', { tier: 3, outcome_count: 2 });
    expect(receivedBody).toEqual({ tier: 3, outcome_count: 2 });
    expect(result).toMatchObject({ to: '0:aa' });
  });

  it('supports anonymous requests by skipping Bearer', async () => {
    writeSession({
      token: 'should-not-attach',
      wallet_address: '0:aa',
      telegram_id: 1,
      expires_at: '2099-01-01T00:00:00Z',
    });
    let seen = 'not-set';
    server.use(
      http.post('http://api.test/v1/auth/telegram', ({ request }) => {
        seen = request.headers.get('authorization') ?? 'missing';
        return HttpResponse.json({
          session_token: 't',
          wallet_address: '0:aa',
          telegram_id: 1,
          expires_at: '2099-01-01T00:00:00Z',
        });
      }),
    );
    await apiPost('/v1/auth/telegram', {}, { anonymous: true });
    expect(seen).toBe('missing');
  });
});
