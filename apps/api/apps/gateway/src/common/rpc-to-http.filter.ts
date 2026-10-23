// common/rpc-to-http.filter.ts
import { RpcError } from '@app/contracts/types/rpc-error';
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { TimeoutError } from 'rxjs';

/**
 * Erreurs NATS indiquant que le service est injoignable.
 * - "503" / NO_RESPONDERS : aucun service n'écoute ce subject
 * - CONNECTION_* : la gateway n'est plus (ou pas encore) connectée au serveur NATS
 * Les noms exacts dépendent de la version de nats.js.
 */
const NATS_UNAVAILABLE_CODES = new Set([
  '503',
  'NO_RESPONDERS',
  'CONNECTION_CLOSED',
  'CONNECTION_DRAINING',
  'CONNECTION_REFUSED',
  'CONNECTION_TIMEOUT',
  'DISCONNECT',
]);

/** Erreurs NATS indiquant un dépassement de délai (requête sans réponse). */
const NATS_TIMEOUT_CODES = new Set(['TIMEOUT', 'REQUEST_TIMEOUT']);

@Catch()
export class RpcToHttpFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcToHttpFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // 1. Erreurs levées par la gateway elle-même (guards, pipes, validation zod...)
    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json(exception.getResponse());
    }

    // 2. Timeout : opérateur rxjs timeout() appliqué sur client.send(...)
    //    ou timeout natif de nats.js
    if (exception instanceof TimeoutError || this.hasNatsCode(exception, NATS_TIMEOUT_CODES)) {
      return this.send(res, HttpStatus.GATEWAY_TIMEOUT, 'Le service a mis trop de temps à répondre');
    }

    // 3. Service injoignable : aucun consommateur sur le subject, ou connexion NATS perdue
    if (
      this.hasNatsCode(exception, NATS_UNAVAILABLE_CODES) ||
      this.messageMatches(exception, /no responders|connection (closed|refused|draining)/i)
    ) {
      this.logger.error(`Service indisponible : ${this.describe(exception)}`);
      return this.send(res, HttpStatus.SERVICE_UNAVAILABLE, 'Service indisponible');
    }

    // 4. Erreur métier renvoyée par un microservice : { status: 409, message: '...' }
    if (this.isRpcError(exception)) {
      return this.send(res, exception.status, exception.message);
    }

    // 5. Tout le reste, y compris les erreurs inattendues d'un microservice.
    //    Nest les renvoie sous la forme { status: 'error', message } (status est
    //    une string, donc elles tombent ici) : on logue le détail, on ne l'expose pas.
    this.logger.error(`Erreur non gérée : ${this.describe(exception)}`);
    return this.send(res, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
  }

  private send(res: Response, status: number, message: string) {
    return res.status(status).json({ statusCode: status, message });
  }

  private isRpcError(e: unknown): e is RpcError {
    if (typeof e !== 'object' || e === null) return false;
    const { status, message } = e as Record<string, unknown>;
    return (
      typeof status === 'number' &&
      status >= 400 &&
      status < 600 &&
      typeof message === 'string'
    );
  }

  /** Les erreurs nats.js exposent un `code` (v2) ou un `name` (classes d'erreur en v3). */
  private hasNatsCode(e: unknown, codes: Set<string>): boolean {
    if (typeof e !== 'object' || e === null) return false;
    const { code, name } = e as Record<string, unknown>;
    return (
      (typeof code === 'string' && codes.has(code.toUpperCase())) ||
      (typeof name === 'string' && codes.has(name.toUpperCase()))
    );
  }

  private messageMatches(e: unknown, pattern: RegExp): boolean {
    const message =
      typeof e === 'string'
        ? e
        : typeof e === 'object' && e !== null
          ? (e as Record<string, unknown>).message
          : undefined;
    return typeof message === 'string' && pattern.test(message);
  }

  private describe(e: unknown): string {
    if (e instanceof Error) return `${e.name}: ${e.message}`;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
}