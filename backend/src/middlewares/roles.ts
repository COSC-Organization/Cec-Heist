
import type { MiddlewareHandler } from 'hono'
import type { AuthEnv } from './auth'

type Role = 'user' | 'admin'

export const requireRole = (...allowedRoles: Role[]): MiddlewareHandler<AuthEnv> => {
  return async (c, next) => {
    const user = c.get('user')

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        { success: false, message: 'Forbidden: insufficient permissions' },
        403
      )
    }

    await next()
  }
}

// Both regular users and admins can access these routes.
export const requireUser = requireRole('user', 'admin')

// Only admins can access admin-only operations.
export const requireAdmin = requireRole('admin')
