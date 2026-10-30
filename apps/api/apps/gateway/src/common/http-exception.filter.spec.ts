// common/http-exception.filter.spec.ts
import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ZodSerializationException } from 'nestjs-zod';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { HttpExceptionFilter } from './http-exception.filter';

/** Produit une vraie ZodError en faisant échouer un schéma. */
function createZodError(): ZodError {
  const result = z.object({ email: z.string() }).safeParse({});
  if (result.success) throw new Error('Le schéma aurait dû échouer');
  return result.error;
}

function createHost(response: unknown = {}) {
  return { getArgByIndex: vi.fn().mockReturnValue(response) } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let loggerError: MockInstance;

  beforeEach(() => {
    loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logging et délégation (BaseExceptionFilter.catch mocké)', () => {
    let superCatch: MockInstance;
    let filter: HttpExceptionFilter;

    beforeEach(() => {
      superCatch = vi
        .spyOn(BaseExceptionFilter.prototype, 'catch')
        .mockImplementation(() => undefined);
      filter = new HttpExceptionFilter();
    });

    it('logue le message de la ZodError pour une ZodSerializationException', () => {
      const zodError = createZodError();
      const host = createHost();

      filter.catch(new ZodSerializationException(zodError), host);

      expect(loggerError).toHaveBeenCalledTimes(1);
      expect(loggerError).toHaveBeenCalledWith(
        `ZodSerializationException: ${zodError.message}`,
      );
    });

    it('délègue ensuite au BaseExceptionFilter avec la même exception et le même host', () => {
      const exception = new ZodSerializationException(createZodError());
      const host = createHost();

      filter.catch(exception, host);

      expect(superCatch).toHaveBeenCalledTimes(1);
      expect(superCatch).toHaveBeenCalledWith(exception, host);
    });

    it('logue avant de déléguer', () => {
      const host = createHost();

      filter.catch(new ZodSerializationException(createZodError()), host);

      expect(loggerError.mock.invocationCallOrder[0]).toBeLessThan(
        superCatch.mock.invocationCallOrder[0]!,
      );
    });

    it('ne logue rien pour une HttpException classique, mais délègue quand même', () => {
      const exception = new HttpException('Forbidden', 403);
      const host = createHost();

      filter.catch(exception, host);

      expect(loggerError).not.toHaveBeenCalled();
      expect(superCatch).toHaveBeenCalledWith(exception, host);
    });

    it('ne logue rien si getZodError() ne renvoie pas une instance de ZodError', () => {
      // Cas typique d'un décalage de version : nestjs-zod utilise une autre copie de zod
      const exception = new ZodSerializationException(createZodError());
      vi.spyOn(exception, 'getZodError').mockReturnValue({
        message: 'faux',
      } as unknown as ZodError);

      filter.catch(exception, createHost());

      expect(loggerError).not.toHaveBeenCalled();
      expect(superCatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('réponse HTTP (BaseExceptionFilter.catch réel, adaptateur factice)', () => {
    const response = { fake: 'response' };
    let applicationRef: {
      isHeadersSent: MockInstance;
      reply: MockInstance;
      end: MockInstance;
    };
    let filter: HttpExceptionFilter;

    beforeEach(() => {
      applicationRef = {
        isHeadersSent: vi.fn().mockReturnValue(false),
        reply: vi.fn(),
        end: vi.fn(),
      };
      // Le BaseExceptionFilter reçoit l'adaptateur HTTP en paramètre du constructeur
      filter = new HttpExceptionFilter(applicationRef as never);
    });

    it('répond avec le status et le message de la HttpException', () => {
      filter.catch(new HttpException('Forbidden', 403), createHost(response));

      expect(applicationRef.reply).toHaveBeenCalledWith(
        response,
        { statusCode: 403, message: 'Forbidden' },
        403,
      );
    });

    it('renvoie le corps tel quel quand la réponse est un objet', () => {
      const body = { statusCode: 400, message: 'Validation failed', issues: [] };

      filter.catch(new HttpException(body, 400), createHost(response));

      expect(applicationRef.reply).toHaveBeenCalledWith(response, body, 400);
    });

    it('répond 500 pour une ZodSerializationException, et la logue', () => {
      const zodError = createZodError();

      filter.catch(new ZodSerializationException(zodError), createHost(response));

      expect(loggerError).toHaveBeenCalledWith(
        `ZodSerializationException: ${zodError.message}`,
      );
      expect(applicationRef.reply).toHaveBeenCalledWith(response, expect.anything(), 500);
    });

    it('termine la réponse sans la réécrire si les headers sont déjà envoyés', () => {
      applicationRef.isHeadersSent.mockReturnValue(true);

      filter.catch(new HttpException('Forbidden', 403), createHost(response));

      expect(applicationRef.reply).not.toHaveBeenCalled();
      expect(applicationRef.end).toHaveBeenCalledWith(response);
    });
  });
});