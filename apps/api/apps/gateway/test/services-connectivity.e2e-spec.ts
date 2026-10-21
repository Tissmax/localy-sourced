import { describe, expect, it } from 'vitest';

const GATEWAY_URL = process.env.E2E_GATEWAY_URL ?? 'http://localhost:3003';
const AUTH_TOKEN = process.env.E2E_AUTH_TOKEN;
const REQUEST_TIMEOUT_MS = 10_000;

interface ServiceTarget {
  name: string;
  path: string;
  expectedStatus?: number[];
}

const TARGETS: ServiceTarget[] = [
  { name: 'products', path: '/health/products' },
  { name: 'sales', path: '/health/sales' },
  { name: 'users', path: '/health/users' },
];

const call = async (path: string) => {
  const started = Date.now();
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(AUTH_TOKEN
        ? { Authorization: `Bearer ${AUTH_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();

  return {
    res,
    text,
    durationMs: Date.now() - started,
  };
};

describe('Gateway ↔ services', () => {
  it('la gateway répond', async () => {
    const res = await fetch(GATEWAY_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    expect(
      res.status,
      `La gateway ne répond pas sur ${GATEWAY_URL}`,
    ).toBeLessThan(500);
  });

  describe.each(TARGETS)('service $name', ({
    name,
    path,
    expectedStatus = [200],
  }) => {
    it(`GET ${path} retourne { status: "ok" }`, async () => {
      const { res, text } = await call(path);

      expect(
        res.status,
        `Le service "${name}" semble injoignable depuis la gateway ` +
          `(GET ${path} → ${res.status}) : ${text.slice(0, 200)}`,
      ).toBeLessThan(500);

      expect(expectedStatus).toContain(res.status);
      expect(res.headers.get('content-type') ?? '').toContain(
        'application/json',
      );

      let body: unknown;

      expect(() => {
        body = JSON.parse(text);
      }).not.toThrow();

      expect(body).toEqual({ status: 'ok' });
    });

    it('répond dans un délai raisonnable', async () => {
      const { durationMs } = await call(path);

      expect(
        durationMs,
        `Le service "${name}" met ${durationMs} ms à répondre`,
      ).toBeLessThan(2_000);
    });
  });
});