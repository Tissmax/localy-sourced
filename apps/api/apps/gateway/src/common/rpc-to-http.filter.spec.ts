// common/rpc-to-http.filter.spec.ts
import {
    ArgumentsHost,
    BadRequestException,
    HttpException,
    Logger,
} from '@nestjs/common';
import { TimeoutError } from 'rxjs';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RpcToHttpFilter } from './rpc-to-http.filter';
/** Fabrique un faux ArgumentsHost qui expose une réponse Express minimale. */
function createHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('RpcToHttpFilter', () => {
  let filter: RpcToHttpFilter;
  let loggerError: MockInstance;

  beforeEach(() => {
    filter = new RpcToHttpFilter();
    // On silencie le logger et on s'en sert pour vérifier ce qui est logué
    loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HttpException (erreurs de la gateway : guards, pipes, validation zod)', () => {
    it('conserve le status et le corps de la réponse', () => {
      const { host, status, json } = createHost();
      const body = { message: 'Validation failed', issues: [{ path: ['email'] }] };

      filter.catch(new BadRequestException(body), host);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(body);
    });

    it('conserve un corps de type string', () => {
      const { host, status, json } = createHost();

      filter.catch(new HttpException('Not found', 404), host);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith('Not found');
    });
  });

  describe('timeouts → 504', () => {
    it('traduit le TimeoutError de rxjs', () => {
      const { host, status, json } = createHost();

      filter.catch(new TimeoutError(), host);

      expect(status).toHaveBeenCalledWith(504);
      expect(json).toHaveBeenCalledWith({
        statusCode: 504,
        message: 'Le service a mis trop de temps à répondre',
      });
    });

    it.each(['TIMEOUT', 'REQUEST_TIMEOUT', 'timeout'])(
      'traduit une erreur NATS avec le code %s',
      (code) => {
        const { host, status } = createHost();

        filter.catch({ code }, host);

        expect(status).toHaveBeenCalledWith(504);
      },
    );
  });

  describe('service injoignable → 503', () => {
    it.each([
      '503',
      'NO_RESPONDERS',
      'CONNECTION_CLOSED',
      'CONNECTION_DRAINING',
      'CONNECTION_REFUSED',
      'CONNECTION_TIMEOUT',
      'DISCONNECT',
    ])('traduit une erreur NATS avec le code %s', (code) => {
      const { host, status, json } = createHost();

      filter.catch({ code }, host);

      expect(status).toHaveBeenCalledWith(503);
      expect(json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Service indisponible',
      });
    });

    it('reconnaît le code en minuscules', () => {
      const { host, status } = createHost();

      filter.catch({ code: 'no_responders' }, host);

      expect(status).toHaveBeenCalledWith(503);
    });

    it('reconnaît le code porté par le name de l\'erreur', () => {
      const { host, status } = createHost();

      filter.catch({ name: 'NO_RESPONDERS' }, host);

      expect(status).toHaveBeenCalledWith(503);
    });

    it.each([
      'No responders available for request',
      'Connection closed',
      'connection refused by server',
      'Connection draining',
    ])('reconnaît le message "%s"', (message) => {
      const { host, status } = createHost();

      filter.catch(new Error(message), host);

      expect(status).toHaveBeenCalledWith(503);
    });

    it('reconnaît un message transmis sous forme de string brute', () => {
      const { host, status } = createHost();

      filter.catch('no responders for subject users.create', host);

      expect(status).toHaveBeenCalledWith(503);
    });

    it('logue le détail de l\'erreur', () => {
      const { host } = createHost();

      filter.catch({ code: '503' }, host);

      expect(loggerError).toHaveBeenCalledTimes(1);
    });
  });

  describe('erreur métier d\'un microservice (RpcError)', () => {
    it('reprend le status et le message renvoyés par le service', () => {
      const { host, status, json } = createHost();

      filter.catch({ status: 409, message: 'Email déjà utilisé' }, host);

      expect(status).toHaveBeenCalledWith(409);
      expect(json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Email déjà utilisé',
      });
      expect(loggerError).not.toHaveBeenCalled();
    });

    it.each([400, 404, 422, 500, 599])('accepte le status %i', (code) => {
      const { host, status } = createHost();

      filter.catch({ status: code, message: 'erreur' }, host);

      expect(status).toHaveBeenCalledWith(code);
    });

    it.each([200, 302, 399, 600, 700])(
      'refuse le status %i (hors 400-599) et renvoie 500',
      (code) => {
        const { host, status } = createHost();

        filter.catch({ status: code, message: 'erreur' }, host);

        expect(status).toHaveBeenCalledWith(500);
      },
    );
  });

  describe('erreurs inattendues → 500', () => {
    it('traite le format { status: "error", message } de Nest (status string)', () => {
      const { host, status } = createHost();

      filter.catch({ status: 'error', message: 'boom' }, host);

      expect(status).toHaveBeenCalledWith(500);
    });

    it('traite un objet sans message', () => {
      const { host, status } = createHost();

      filter.catch({ status: 409 }, host);

      expect(status).toHaveBeenCalledWith(500);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['une string', 'quelque chose a planté'],
      ['un nombre', 42],
    ])('traite %s sans planter', (_label, exception) => {
      const { host, status } = createHost();

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(500);
    });

    it('n\'expose pas le détail de l\'erreur au client, mais le logue', () => {
      const { host, json } = createHost();

      filter.catch(new Error('SELECT * FROM users : password=secret'), host);

      expect(json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
      expect(JSON.stringify(json.mock.calls)).not.toContain('secret');
      expect(loggerError).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
      );
    });

    it('ne plante pas si l\'erreur n\'est pas sérialisable (référence circulaire)', () => {
      const { host, status } = createHost();
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(() => filter.catch(circular, host)).not.toThrow();
      expect(status).toHaveBeenCalledWith(500);
    });
  });
});