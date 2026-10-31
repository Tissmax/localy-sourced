/*
https://docs.nestjs.com/guards#guards
*/

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
  const raw = req.body?.email;
  const email =
    typeof raw === 'string' && raw.length <= 254
      ? raw.trim().toLowerCase()
      : 'anon';
  return `${req.ip}:${email}`;
}
}
