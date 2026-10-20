
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'
import type { AppContext } from '../types'

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
    },
  })
}

export async function createTeam(c: AppContext) {
  let body: { team_name?: unknown; score?: unknown }

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

  const score = body.score ?? 0
  if (!Number.isSafeInteger(score) || (score as number) < 0) {
    return c.json({ success: false, message: 'score must be a non-negative integer' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)
    const [team] = await db.insert(teams).values({
      teamName: body.team_name.trim(),
      score: score as number,
    }).returning()

    return c.json({
      success: true,
      data: { id: team.id, team_name: team.teamName, score: team.score },
    }, 201)
  } catch (error) {
    console.error('Create team failed:', error)
    return c.json({ success: false, message: 'Unable to create team' }, 500)
  }
}

export async function updateTeam(c: AppContext) {
  const id = Number(c.req.param('id'))
  let body: { team_name?: unknown; score?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const updates: { teamName?: string; score?: number } = {}

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

  if (body.score !== undefined) {
    if (!Number.isSafeInteger(body.score) || (body.score as number) < 0) {
      return c.json({ success: false, message: 'score must be a non-negative integer' }, 400)
    }
    updates.score = body.score as number
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: 'Provide team_name or score to update' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)
    const [team] = await db.update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning()

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
    const [team] = await db.delete(teams)
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
