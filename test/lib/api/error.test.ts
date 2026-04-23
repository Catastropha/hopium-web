import { describe, expect, it } from 'vitest';

import { ApiError, userMessage } from '@/lib/api/error';

describe('ApiError', () => {
  it('captures status, code, and message', () => {
    const err = new ApiError(404, 'market:not-found-1');
    expect(err.status).toBe(404);
    expect(err.code).toBe('market:not-found-1');
    expect(err.name).toBe('ApiError');
  });

  it('classifies auth, not-found, and validation', () => {
    expect(new ApiError(401, 'auth:invalid-session-1').isAuth()).toBe(true);
    expect(new ApiError(404, 'market:not-found-1').isNotFound()).toBe(true);
    expect(new ApiError(422, 'market:invalid-tier-1').isValidation()).toBe(true);
  });
});

describe('userMessage', () => {
  it('maps known codes to copy', () => {
    expect(userMessage(new ApiError(404, 'market:not-found-1'))).toMatch(/no longer exists/);
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
