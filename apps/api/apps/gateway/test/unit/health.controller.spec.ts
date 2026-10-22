import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from '../../src/health/health.controller';

describe('HealthController', () => {
  const natsClient = {
    send: vi.fn(),
  };

  let app: Awaited<ReturnType<typeof createTestApp>>;

  const createTestApp = async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: natsClient,
        },
      ],
    }).compile();

    const nestApp = moduleRef.createNestApplication();
    await nestApp.init();

    return nestApp;
  };

  afterEach(async () => {
    await app?.close();
    vi.clearAllMocks();
  });

  it('retourne la santé du service products', async () => {
    natsClient.send.mockReturnValue(of({ status: 'ok' }));

    app = await createTestApp();

    await request(app.getHttpServer())
      .get('/health/products')
      .expect(200)
      .expect({ status: 'ok' });

    expect(natsClient.send).toHaveBeenCalledWith(
      { cmd: 'products.health' },
      {},
    );
  });

  it('retourne la santé du service sales', async () => {
    natsClient.send.mockReturnValue(of({ status: 'ok' }));

    app = await createTestApp();

    await request(app.getHttpServer())
      .get('/health/sales')
      .expect(200)
      .expect({ status: 'ok' });

    expect(natsClient.send).toHaveBeenCalledWith(
      { cmd: 'sales.health' },
      {},
    );
  });

  it('retourne la santé du service users', async () => {
    natsClient.send.mockReturnValue(of({ status: 'ok' }));

    app = await createTestApp();

    await request(app.getHttpServer())
      .get('/health/users')
      .expect(200)
      .expect({ status: 'ok' });

    expect(natsClient.send).toHaveBeenCalledWith(
      { cmd: 'users.health' },
      {},
    );
  });
});