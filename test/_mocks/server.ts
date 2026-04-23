import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('http://api.test/v1/markets', () => HttpResponse.json([])),
  http.get('http://api.test/v1/leaderboard', () => HttpResponse.json([])),
];

export const server = setupServer(...handlers);
