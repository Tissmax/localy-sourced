import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('demande la santé de products à NATS', async () => {

    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: 'ok',
    });
  });
});