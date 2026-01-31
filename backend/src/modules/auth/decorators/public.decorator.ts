import { SetMetadata } from "@nestjs/common";

/**
 * Public Decorator
 * Marks routes as public (no authentication required)
 *
 * Usage:
 * @Public()
 * @Get('public-endpoint')
 * async publicMethod() { ... }
 */
export const Public = () => SetMetadata("isPublic", true);
