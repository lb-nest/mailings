import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Auth = createParamDecorator((_, context: ExecutionContext) => {
  return context.switchToHttp().getRequest().user;
});
