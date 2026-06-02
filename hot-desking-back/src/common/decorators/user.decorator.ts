import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from '../../auth/dto';
import { JWTUser } from '../../auth/models';

/**
 * @description Parametr decorator. Gets user from authorized request.
 * @returns JWTUser
 */
export const User = createParamDecorator<unknown, JWTUser>(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    return request.user;
  },
);
