
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '../../db'
import { users } from '../../db/schema/users'
import type { CloudflareBindings } from '../../types'

const loginRoutes = new Hono<{ Bindings: CloudflareBindings }>()

loginRoutes.post('/', async (c) => {
  let body: { email?: unknown; password?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json(
      { success: false, message: 'Invalid JSON body' },
      400
    )
  }

  if (
    typeof body.email !== 'string' ||
    typeof body.password !== 'string' ||
    !body.email.trim() ||
    !body.password
  ) {
    return c.json(
      { success: false, message: 'Email and password are required' },
      400
    )
  }

  const email = body.email.trim().toLowerCase()
  const password = body.password

  if (
  email.length > 254 ||
  new TextEncoder().encode(password).length > 72
) {
    return c.json(
      { success: false, message: 'Invalid email or password' },
      400
    )
  }

  if (!c.env.JWT_SECRET || c.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET is missing or too short')
    return c.json(
      { success: false, message: 'Authentication is not configured' },
      500
    )
  }

  try {
    const db = createDb(c.env.cec_heist_db)

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user || !(await compare(password, user.passwordHash))) {
      return c.json(
        { success: false, message: 'Invalid email or password' },
        401
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const token = await sign(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role,
        iat: now,
        exp: now + 60 * 60,
      },
      c.env.JWT_SECRET,
      'HS256'
    )

    return c.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login failed:', error)
    return c.json(
      { success: false, message: 'Unable to process login' },
      500
    )
  }
})

export default loginRoutes
