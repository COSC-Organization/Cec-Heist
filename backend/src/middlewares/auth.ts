
import { verify } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'
import type { CloudflareBindings } from '../types'

export type AuthUser = {
  id: string
  email: string
  role: 'user' | 'admin'
}

type AuthVariables = {
  user: AuthUser
}

export type AuthEnv = {
  Bindings: CloudflareBindings
  Variables: AuthVariables
}

export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const authorization = c.req.header('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return c.json(
      { success: false, message: 'Authentication required' },
      401
    )
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token || !c.env.JWT_SECRET || c.env.JWT_SECRET.length < 32) {
    return c.json(
      { success: false, message: 'Invalid or expired token' },
      401
    )
  }

  let payload

  try {
    payload = await verify(token, c.env.JWT_SECRET, 'HS256')
  } catch {
    return c.json(
      { success: false, message: 'Invalid or expired token' },
      401
    )
  }

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    (payload.role !== 'user' && payload.role !== 'admin')
  ) {
    return c.json(
      { success: false, message: 'Invalid token payload' },
      401
    )
  }

  c.set('user', {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  })

  await next()
}
