import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from '../../users/user.select';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<{ user: PublicUser }>().user;
});
