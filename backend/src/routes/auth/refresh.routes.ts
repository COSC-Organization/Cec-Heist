
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { eq } from 'drizzle-orm'
import { createDb } from '../../db'
import { users } from '../../db/schema/users'
import type { CloudflareBindings } from '../../types'

const refreshRoutes = new Hono<{ Bindings: CloudflareBindings }>()

refreshRoutes.post('/', async (c) => {
  const body = await c.req.json<{ refreshToken?: unknown }>().catch(() => null)

  if (
    !body ||
    typeof body.refreshToken !== 'string' ||
    !body.refreshToken
  ) {
    return c.json(
      { success: false, message: 'Refresh token is required' },
      400
    )
  }

  if (!c.env.JWT_SECRET || c.env.JWT_SECRET.length < 32) {
    return c.json(
      { success: false, message: 'Authentication is not configured' },
      500
    )
  }

  try {
    const payload = await verify(
      body.refreshToken,
      c.env.JWT_SECRET,
      'HS256'
    )

    if (
      typeof payload.sub !== 'string' ||
      payload.tokenType !== 'refresh'
    ) {
      return c.json(
        { success: false, message: 'Invalid refresh token' },
        401
      )
    }

    const db = createDb(c.env.cec_heist_db)
    const user = await db.query.users.findFirst({
      where: eq(users.id, Number(payload.sub)),
    })

    if (!user) {
      return c.json(
        { success: false, message: 'User not found' },
        401
      )
    }

    const now = Math.floor(Date.now() / 1000)

    const accessToken = await sign(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role,
        tokenType: 'access',
        iat: now,
        exp: now + 60 * 60,
      },
      c.env.JWT_SECRET,
      'HS256'
    )

    return c.json({
      success: true,
      accessToken,
      expiresIn: 3600,
    })
  } catch {
    return c.json(
      { success: false, message: 'Invalid or expired refresh token' },
      401
    )
  }
})

export default refreshRoutes
