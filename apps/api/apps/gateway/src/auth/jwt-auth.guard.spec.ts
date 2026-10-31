// auth/jwt-auth.guard.spec.ts
import { IS_PUBLIC_KEY } from '@app/modules/decorators/public.decorator';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Mocked, MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Mocked<Reflector>;
  let context: ExecutionContext;
  let superCanActivate: MockInstance;

  const handler = vi.fn();
  const controllerClass = class {};

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as unknown as Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);

    context = {
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as unknown as ExecutionContext;

    // On espionne canActivate de la classe parente (AuthGuard('jwt'))
    // pour ne pas exécuter la vraie stratégie Passport dans un test unitaire.
    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
    superCanActivate = vi.spyOn(parentPrototype, 'canActivate');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lit la metadata IS_PUBLIC_KEY sur le handler puis sur la classe', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handler,
      controllerClass,
    ]);
  });

  it('autorise directement une route @Public() sans vérifier le JWT', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it("délègue à la stratégie JWT quand la route n'est pas publique", async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    superCanActivate.mockResolvedValue(true);

    const result = await guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });

  it("délègue à la stratégie JWT quand la metadata n'est pas définie", async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    superCanActivate.mockResolvedValue(true);

    await guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalledTimes(1);
  });

  it("refuse l'accès si la stratégie JWT rejette le token", async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    superCanActivate.mockRejectedValue(new UnauthorizedException());

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});