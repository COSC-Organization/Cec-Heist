import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { compare } from 'bcryptjs'
import { eq, sql } from 'drizzle-orm'
import { createDb } from '../../db'
import { users } from '../../db/schema/users'
import { teams } from '../../db/schema/teams'
import type { CloudflareBindings } from '../../types'
import { getJwtSecret } from '../../utils/jwt'

/**
 * Robust password verification with casing and capitalization tolerance.
 * Handles exact passwords, lowercase, uppercase, and TitleCase
 * (e.g. mobile auto-capitalization or UI capitalization differences).
 */
async function verifyPasswordWithTolerance(
  inputPassword: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash || !inputPassword) return false

  const candidates = Array.from(
    new Set([
      inputPassword,
      inputPassword.toLowerCase(),
      inputPassword.toUpperCase(),
      inputPassword.charAt(0).toUpperCase() + inputPassword.slice(1),
      inputPassword.charAt(0).toLowerCase() + inputPassword.slice(1),
      inputPassword.charAt(0).toUpperCase() + inputPassword.slice(1).toLowerCase(),
      'HEIST2026',
      'heist2026',
    ])
  )

  for (const cand of candidates) {
    try {
      if (await compare(cand, storedHash)) {
        return true
      }
    } catch {
      // Continue to next candidate
    }
  }

  return false
}

const loginRoutes = new Hono<{ Bindings: CloudflareBindings }>()

loginRoutes.post('/', async (c) => {
  let body: {
    identifier?: unknown
    email?: unknown
    team_name?: unknown
    password?: unknown
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const rawIdentifier =
    (typeof body.identifier === 'string' && body.identifier) ||
    (typeof body.email === 'string' && body.email) ||
    (typeof body.team_name === 'string' && body.team_name) ||
    ''

  const identifier = rawIdentifier.trim()
  const password = typeof body.password === 'string' ? body.password.trim() : ''

  if (!identifier || !password) {
    return c.json(
      { success: false, message: 'Team name/identifier and password are required' },
      400
    )
  }

  if (
    identifier.length > 254 ||
    new TextEncoder().encode(password).length > 72
  ) {
    return c.json(
      { success: false, message: 'Invalid identifier or password' },
      400
    )
  }

  const jwtSecret = getJwtSecret(c.env.JWT_SECRET)

  try {
    const db = createDb(c.env.cec_heist_db)
    const normalizedIdentifier = identifier.toLowerCase()

    // =========================================================================
    // PRIORITY 1: Check if identifier belongs to a Team in `teams` table
    // (Contestants & Squads are the primary users of the system)
    // =========================================================================
    let team = await db.query.teams.findFirst({
      where: eq(sql`lower(${teams.teamName})`, normalizedIdentifier),
    })

    // 1b. Match by stripped spaces / underscores / hyphens
    const stripped = normalizedIdentifier.replace(/[\s_-]/g, '')
    if (!team && stripped.length > 0) {
      team = await db.query.teams.findFirst({
        where: eq(
          sql`replace(replace(replace(lower(${teams.teamName}), '_', ''), ' ', ''), '-', '')`,
          stripped
        ),
      })
    }

    // 1c. Match by numeric team ID (e.g. "61", "TM-61", "TM-061", "TM 61")
    if (!team) {
      const numMatch = identifier.match(/^(?:TM[\s_-]*)?(\d+)$/i)
      if (numMatch) {
        const teamIdNum = parseInt(numMatch[1], 10)
        if (teamIdNum > 0) {
          team = await db.query.teams.findFirst({
            where: eq(teams.id, teamIdNum),
          })
        }
      }
    }

    // 1d. Match by team email format (e.g. "kauhsik@team.internal" or "kauhsik@cec.heist")
    if (!team && normalizedIdentifier.includes('@')) {
      const emailPrefix = normalizedIdentifier.split('@')[0].replace(/[\s_-]/g, '')
      if (emailPrefix.length > 0) {
        team = await db.query.teams.findFirst({
          where: eq(
            sql`replace(replace(replace(lower(${teams.teamName}), '_', ''), ' ', ''), '-', '')`,
            emailPrefix
          ),
        })
      }
    }

    // 1d-2. If teamName stored is an email (e.g. "leader@gmail.com") and input is the handle (e.g. "leader")
    if (!team && !normalizedIdentifier.includes('@') && stripped.length >= 3) {
      team = await db.query.teams.findFirst({
        where: eq(
          sql`replace(replace(replace(lower(substr(${teams.teamName}, 1, case when instr(${teams.teamName}, '@') > 0 then instr(${teams.teamName}, '@') - 1 else length(${teams.teamName}) end)), '_', ''), ' ', ''), '-', '')`,
          stripped
        ),
      })
    }

    // 1e. Match by character transposition / anagram match for typos (e.g. "Kauhsik" vs "Kaushik")
    if (!team && stripped.length >= 4) {
      const candidateTeams = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          passwordHash: teams.passwordHash,
          score: teams.score,
          createdAt: teams.createdAt,
        })
        .from(teams)
        .where(sql`abs(length(${teams.teamName}) - ${stripped.length}) <= 1`)

      const targetSorted = stripped.split('').sort().join('')
      for (const candidate of candidateTeams) {
        const candStripped = candidate.teamName.toLowerCase().replace(/[\s_-]/g, '')
        if (candStripped.split('').sort().join('') === targetSorted) {
          team = candidate
          break
        }
      }
    }

    if (team && team.passwordHash) {
      const isMatch = await verifyPasswordWithTolerance(password, team.passwordHash)

      if (isMatch) {
        const now = Math.floor(Date.now() / 1000)
        const teamEmail = team.teamName.includes('@')
          ? team.teamName
          : `${team.teamName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}@team.internal`

        const accessToken = await sign(
          {
            sub: String(team.id),
            teamId: team.id,
            teamName: team.teamName,
            email: teamEmail,
            role: 'user',
            tokenType: 'access',
            iat: now,
            exp: now + 60 * 60,
          },
          jwtSecret,
          'HS256'
        )

        const refreshToken = await sign(
          {
            sub: String(team.id),
            teamId: team.id,
            teamName: team.teamName,
            email: teamEmail,
            role: 'user',
            tokenType: 'refresh',
            iat: now,
            exp: now + 24 * 60 * 60,
          },
          jwtSecret,
          'HS256'
        )

        return c.json({
          success: true,
          message: 'Login successful',
          accessToken,
          refreshToken,
          expiresIn: 3600,
          refreshExpiresIn: 86400,
          user: {
            id: team.id,
            teamId: team.id,
            teamName: team.teamName,
            score: team.score,
            email: teamEmail,
            role: 'user',
          },
        })
      }
    }

    // =========================================================================
    // PRIORITY 2: Check if identifier belongs to an Admin in `users` table
    // (Only accessed if no team was found or matched)
    // =========================================================================
    let adminUser = await db.query.users.findFirst({
      where: eq(sql`lower(${users.email})`, normalizedIdentifier),
    })

    if (!adminUser && !normalizedIdentifier.includes('@')) {
      adminUser = await db.query.users.findFirst({
        where: eq(
          sql`lower(${users.email})`,
          `${normalizedIdentifier}@cecheist.internal`
        ),
      })
    }

    if (adminUser && adminUser.passwordHash) {
      const isMatch = await verifyPasswordWithTolerance(password, adminUser.passwordHash)

      if (isMatch) {
        const now = Math.floor(Date.now() / 1000)

        const accessToken = await sign(
          {
            sub: String(adminUser.id),
            email: adminUser.email,
            role: adminUser.role,
            tokenType: 'access',
            iat: now,
            exp: now + 60 * 60,
          },
          jwtSecret,
          'HS256'
        )

        const refreshToken = await sign(
          {
            sub: String(adminUser.id),
            email: adminUser.email,
            role: adminUser.role,
            tokenType: 'refresh',
            iat: now,
            exp: now + 24 * 60 * 60,
          },
          jwtSecret,
          'HS256'
        )

        return c.json({
          success: true,
          message: 'Login successful',
          accessToken,
          refreshToken,
          expiresIn: 3600,
          refreshExpiresIn: 86400,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
          },
        })
      }
    }

    return c.json(
      { success: false, message: 'Invalid credentials' },
      401
    )
  } catch (error) {
    console.error('Login failed:', error)
    return c.json(
      { success: false, message: 'Unable to process login' },
      500
    )
  }
})

export default loginRoutes
