import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest, SafeUser } from '../types/user.types';

/** Injects the user attached to the request by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SafeUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      // Only reachable if the decorator is used on a @Public() route.
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
