// test/security.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GatewayModule } from 'apps/gateway/src/gateway.module';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Sécurité HTTP', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({ imports: [GatewayModule] }).compile();
    app = mod.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 'uniquelocal');
  app.useSecurityHeaders({
    strictTransportSecurity: { maxAge: 63072000, preload: true },
    xFrameOptions: { action: 'deny' },
  });
    app.enableCors({ origin: 'https://app.monsite.fr' });
    await app.init();
  });
  afterEach(() => app.close());

  it('pose les en-têtes de sécurité', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('bloque la 101ème requête avec un 429', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app.getHttpServer()).get('/').expect(200);
    }
    await request(app.getHttpServer()).get('/').expect(429);
  });

  it('refuse une origine inconnue', async () => {
    const res = await request(app.getHttpServer())
      .get('/').set('Origin', 'https://evil.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('bloque la 6ème tentative de login avec le même email', async () => {
  const body = { email: 'user@test.fr', password: 'mauvais-mdp' };

  for (let i = 0; i < 5; i++) {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send(body);
    expect(res.status).not.toBe(429); // 401 attendu ici, pas 429
  }

  await request(app.getHttpServer())
    .post('/users/login')
    .send(body)
    .expect(429);
});

it("ne bloque pas un autre email depuis la même IP", async () => {
  for (let i = 0; i < 6; i++) {
    await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'a@test.fr', password: 'x' });
  }

  const res = await request(app.getHttpServer())
    .post('/users/login')
    .send({ email: 'b@test.fr', password: 'x' });
  expect(res.status).not.toBe(429);
});

});