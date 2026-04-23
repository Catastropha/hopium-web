import { describe, expect, it } from 'vitest';

import { ApiError, userMessage } from '@/lib/api/error';

describe('ApiError', () => {
  it('captures status, code, and message', () => {
    const err = new ApiError(404, 'market:not-found-0');
    expect(err.status).toBe(404);
    expect(err.code).toBe('market:not-found-0');
    expect(err.name).toBe('ApiError');
  });

  it('classifies auth, not-found, and validation', () => {
    expect(new ApiError(401, 'auth:session-0').isAuth()).toBe(true);
    expect(new ApiError(404, 'market:not-found-0').isNotFound()).toBe(true);
    expect(new ApiError(422, 'market:tier-0').isValidation()).toBe(true);
  });
});

describe('userMessage', () => {
  it('maps known codes to copy', () => {
    expect(userMessage(new ApiError(404, 'market:not-found-0'))).toMatch(/no longer exists/);
  });

  it('covers every auth:* code hopium-api emits', () => {
    // Regression guard — if the backend adds or renames an auth code the
    // frontend should either map it or this test updates in the same PR.
    for (const code of [
      'auth:telegram-0',
      'auth:telegram-1',
      'auth:telegram-2',
      'auth:ton-proof-0',
      'auth:ton-proof-1',
      'auth:ton-proof-2',
      'auth:ton-proof-3',
      'auth:ton-proof-4',
      'auth:session-0',
      'auth:session-1',
      'auth:source-0',
    ]) {
      const copy = userMessage(new ApiError(401, code));
      expect(copy, `unmapped auth code: ${code}`).not.toBe('Request failed.');
    }
  });

  it('falls back to a neutral message for unknown codes', () => {
    expect(userMessage(new ApiError(500, 'unknown:weird-9'))).toBe('Request failed.');
  });

  it('passes through plain Error.message', () => {
    expect(userMessage(new Error('boom'))).toBe('boom');
  });

  it('handles non-error values', () => {
    expect(userMessage('nope')).toBe('Unknown error.');
  });
});
