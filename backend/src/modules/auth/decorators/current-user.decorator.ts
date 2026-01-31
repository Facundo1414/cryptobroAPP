import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * CurrentUser Decorator
 * Extracts the current authenticated user from the request
 *
 * Usage:
 * @Get('profile')
 * async getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
