// auth/jwt-auth.guard.spec.ts
import { describe, expect, it } from 'vitest';

// login-throttler.guard.spec.ts
import { LoginThrottlerGuard } from './login-throttler.guard';

class TestableGuard extends LoginThrottlerGuard {
  track(req: Record<string, any>) {
    return this.getTracker(req);
  }
}

describe('LoginThrottlerGuard.getTracker', () => {
  // Object.create : on évite le constructeur et ses dépendances (options, storage, reflector)
  const guard = Object.create(TestableGuard.prototype) as TestableGuard;

  it('combine IP et email', async () => {
    const key = await guard.track({ ip: '1.2.3.4', body: { email: 'a@x.fr' } });
    expect(key).toBe('1.2.3.4:a@x.fr');
  });

  it('utilise "anon" sans email', async () => {
    expect(await guard.track({ ip: '1.2.3.4', body: {} })).toBe('1.2.3.4:anon');
  });

  it('ne plante pas sans body', async () => {
    expect(await guard.track({ ip: '1.2.3.4' })).toBe('1.2.3.4:anon');
  });

  it('même IP + même email → même clé', async () => {
    const a = await guard.track({ ip: '1.2.3.4', body: { email: 'a@x.fr' } });
    const b = await guard.track({ ip: '1.2.3.4', body: { email: 'a@x.fr' } });
    expect(a).toBe(b);
  });

  it('même IP + emails différents → clés différentes', async () => {
    const a = await guard.track({ ip: '1.2.3.4', body: { email: 'a@x.fr' } });
    const b = await guard.track({ ip: '1.2.3.4', body: { email: 'b@x.fr' } });
    expect(a).not.toBe(b);
  });

  it('IP différentes + même email → clés différentes', async () => {
    const a = await guard.track({ ip: '1.1.1.1', body: { email: 'a@x.fr' } });
    const b = await guard.track({ ip: '2.2.2.2', body: { email: 'a@x.fr' } });
    expect(a).not.toBe(b);
  });

  it('normalise la casse et les espaces', async () => {
  const a = await guard.track({ ip: '1.2.3.4', body: { email: ' A@X.fr ' } });
  const b = await guard.track({ ip: '1.2.3.4', body: { email: 'a@x.fr' } });
  expect(a).toBe(b);
});

it('ignore un email non-string', async () => {
  expect(await guard.track({ ip: '1.2.3.4', body: { email: { a: 1 } } }))
    .toBe('1.2.3.4:anon');
  expect(await guard.track({ ip: '1.2.3.4', body: { email: ['a@x.fr'] } }))
    .toBe('1.2.3.4:anon');
});

it('ignore un email trop long', async () => {
  expect(await guard.track({ ip: '1.2.3.4', body: { email: 'a'.repeat(300) } }))
    .toBe('1.2.3.4:anon');
});
});