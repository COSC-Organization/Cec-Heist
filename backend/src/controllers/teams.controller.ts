import { eq, sql } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'
import type { AppContext } from '../types'

export async function getAllTeams(c: AppContext) {
  const db = createDb(c.env.cec_heist_db)
  const allTeams = await db
    .select({
      id: teams.id,
      team_name: teams.teamName,
      score: teams.score,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .orderBy(teams.id)

  return c.json({
    success: true,
    data: allTeams,
  })
}

export async function getTeamById(c: AppContext) {
  const id = Number(c.req.param('id'))
  const db = createDb(c.env.cec_heist_db)

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, id),
  })

  if (!team) {
    return c.json({ success: false, message: 'Team not found' }, 404)
  }

  return c.json({
    success: true,
    data: {
      id: team.id,
      team_name: team.teamName,
      score: team.score,
      createdAt: team.createdAt,
    },
  })
}

export async function createTeam(c: AppContext) {
  let body: { team_name?: unknown; password?: unknown; score?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  if (
    typeof body.team_name !== 'string' ||
    !body.team_name.trim() ||
    body.team_name.trim().length > 100
  ) {
    return c.json({ success: false, message: 'team_name must be 1–100 characters' }, 400)
  }

  const teamName = body.team_name.trim()
  const password = typeof body.password === 'string' ? body.password.trim() : ''

  if (!password || password.length < 4 || new TextEncoder().encode(password).length > 72) {
    return c.json(
      { success: false, message: 'password is required and must be between 4 and 72 characters' },
      400
    )
  }

  const score = body.score ?? 0
  if (!Number.isSafeInteger(score) || (score as number) < 0) {
    return c.json({ success: false, message: 'score must be a non-negative integer' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)

    // Check if team name already exists
    const existing = await db.query.teams.findFirst({
      where: eq(sql`lower(${teams.teamName})`, teamName.toLowerCase()),
    })

    if (existing) {
      return c.json(
        { success: false, message: 'A team with this name already exists' },
        409
      )
    }

    const passwordHash = await hash(password, 10)

    const [team] = await db
      .insert(teams)
      .values({
        teamName,
        passwordHash,
        score: score as number,
      })
      .returning({
        id: teams.id,
        teamName: teams.teamName,
        score: teams.score,
        createdAt: teams.createdAt,
      })

    return c.json(
      {
        success: true,
        data: {
          id: team.id,
          team_name: team.teamName,
          score: team.score,
          createdAt: team.createdAt,
        },
      },
      201
    )
  } catch (error) {
    console.error('Create team failed:', error)
    const errStr = String(error)
    if (errStr.includes('UNIQUE constraint failed') || errStr.includes('teams_team_name_unique')) {
      return c.json({ success: false, message: 'A team with this name already exists' }, 409)
    }
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unable to create team',
      },
      500
    )
  }
}

export async function createTeamsBulk(c: AppContext) {
  let body: { teams?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const inputTeams = Array.isArray(body?.teams)
    ? body.teams
    : Array.isArray(body)
    ? body
    : null

  if (!inputTeams || inputTeams.length === 0) {
    return c.json(
      { success: false, message: 'An array of teams is required' },
      400
    )
  }

  const db = createDb(c.env.cec_heist_db)
  const created: Array<{ id: number; team_name: string; score: number }> = []
  const errors: Array<{ team_name?: string; reason: string }> = []

  for (const item of inputTeams) {
    const teamName = typeof item?.team_name === 'string' ? item.team_name.trim() : ''
    const password = typeof item?.password === 'string' ? item.password.trim() : 'HEIST2026'
    const score = Number.isSafeInteger(item?.score) && item.score >= 0 ? item.score : 0

    if (!teamName || teamName.length > 100) {
      errors.push({ team_name: teamName, reason: 'Invalid team name' })
      continue
    }

    try {
      const existing = await db.query.teams.findFirst({
        where: eq(sql`lower(${teams.teamName})`, teamName.toLowerCase()),
      })

      if (existing) {
        errors.push({ team_name: teamName, reason: 'Team name already exists' })
        continue
      }

      const passwordHash = await hash(password, 10)
      const [newTeam] = await db
        .insert(teams)
        .values({
          teamName,
          passwordHash,
          score,
        })
        .returning({
          id: teams.id,
          teamName: teams.teamName,
          score: teams.score,
        })

      created.push({
        id: newTeam.id,
        team_name: newTeam.teamName,
        score: newTeam.score,
      })
    } catch {
      errors.push({ team_name: teamName, reason: 'Database insertion error' })
    }
  }

  return c.json(
    {
      success: true,
      count: created.length,
      data: created,
      errors: errors.length > 0 ? errors : undefined,
    },
    201
  )
}

export async function updateTeam(c: AppContext) {
  const id = Number(c.req.param('id'))
  let body: { team_name?: unknown; password?: unknown; score?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const updates: { teamName?: string; passwordHash?: string; score?: number } = {}

  if (body.team_name !== undefined) {
    if (
      typeof body.team_name !== 'string' ||
      !body.team_name.trim() ||
      body.team_name.trim().length > 100
    ) {
      return c.json({ success: false, message: 'team_name must be 1–100 characters' }, 400)
    }
    updates.teamName = body.team_name.trim()
  }

  if (body.password !== undefined) {
    if (
      typeof body.password !== 'string' ||
      body.password.trim().length < 4 ||
      new TextEncoder().encode(body.password).length > 72
    ) {
      return c.json(
        { success: false, message: 'password must be between 4 and 72 characters' },
        400
      )
    }
    updates.passwordHash = await hash(body.password.trim(), 10)
  }

  if (body.score !== undefined) {
    if (!Number.isSafeInteger(body.score) || (body.score as number) < 0) {
      return c.json({ success: false, message: 'score must be a non-negative integer' }, 400)
    }
    updates.score = body.score as number
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: 'Provide team_name, password, or score to update' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)
    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning({
        id: teams.id,
        teamName: teams.teamName,
        score: teams.score,
      })

    if (!team) {
      return c.json({ success: false, message: 'Team not found' }, 404)
    }

    return c.json({
      success: true,
      data: { id: team.id, team_name: team.teamName, score: team.score },
    })
  } catch (error) {
    console.error('Update team failed:', error)
    return c.json({ success: false, message: 'Unable to update team' }, 500)
  }
}

export async function deleteTeam(c: AppContext) {
  const id = Number(c.req.param('id'))
  const db = createDb(c.env.cec_heist_db)

  try {
    const [team] = await db
      .delete(teams)
      .where(eq(teams.id, id))
      .returning({ id: teams.id })

    if (!team) {
      return c.json({ success: false, message: 'Team not found' }, 404)
    }

    return c.json({ success: true, message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Delete team failed:', error)
    return c.json({ success: false, message: 'Unable to delete team' }, 500)
  }
}
