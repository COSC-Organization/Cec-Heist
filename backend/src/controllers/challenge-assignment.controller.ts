import { eq, and } from 'drizzle-orm'
import { createDb } from '../db'
import { teamChallengeAssignments } from '../db/schema/team-challenge-assignments'
import { challenges } from '../db/schema/challenges'
import { teams } from '../db/schema/teams'
import { assignChallengesToTeam } from '../services/challenge-assignment.service'
import type { AppContext } from '../types'

export async function assignTeamChallenges(c: AppContext) {
  const teamId = Number(c.req.param('teamId'))
  const level = Number(c.req.param('level'))

  if (!Number.isSafeInteger(teamId) || teamId <= 0) {
    return c.json({ success: false, message: 'Invalid team ID' }, 400)
  }

  const result = await assignChallengesToTeam(c, teamId, level)

  if (!result.success) {
    const status = result.message === 'Team not found' ? 404 : 400
    return c.json(result, status)
  }

  return c.json(result)
}

export async function getTeamAssignedChallenges(c: AppContext) {
  const teamId = Number(c.req.param('teamId'))
  const levelParam = c.req.query('level')
  const db = createDb(c.env.cec_heist_db)
  const authUser = c.get('user')

  // Regular users can access only their own team's assignments.
  if (authUser.role === 'user') {
    const userTeamId = authUser.teamId ?? Number(authUser.id)
    if (userTeamId !== teamId) {
      return c.json(
        {
          success: false,
          message: "You cannot access another team's assignments",
        },
        403,
      )
    }
  }

  if (!Number.isSafeInteger(teamId) || teamId <= 0) {
    return c.json({ success: false, message: 'Invalid team ID' }, 400)
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  })

  if (!team) {
    return c.json({ success: false, message: 'Team not found' }, 404)
  }

  const conditions = [eq(teamChallengeAssignments.teamId, teamId)]

  if (levelParam !== undefined) {
    const level = Number(levelParam)

    if (!Number.isInteger(level) || level < 1 || level > 4) {
      return c.json({ success: false, message: 'Level must be between 1 and 4' }, 400)
    }

    conditions.push(eq(teamChallengeAssignments.level, level))
  }

  const assigned = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      description: challenges.description,
      hintUrl: challenges.hintUrl,
      level: challenges.level,
      difficulty: challenges.difficulty,
      assignedAt: teamChallengeAssignments.assignedAt,
    })
    .from(teamChallengeAssignments)
    .innerJoin(
      challenges,
      eq(teamChallengeAssignments.challengeId, challenges.id),
    )
    .where(and(...conditions))

  return c.json({
    success: true,
    data: assigned,
  })
}