import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Throttles per authenticated user (falls back to IP). Run after JwtAuthGuard. */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const userId = (req.user as { id?: number } | undefined)?.id;
    return Promise.resolve(userId ? `user-${userId}` : String(req.ip));
  }
}
