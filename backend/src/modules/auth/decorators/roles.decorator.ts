import { SetMetadata } from "@nestjs/common";

/**
 * Roles Decorator
 * Restricts route access to users with specific roles
 *
 * Usage:
 * @Roles('admin', 'premium')
 * @Get('admin-endpoint')
 * async adminMethod() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
