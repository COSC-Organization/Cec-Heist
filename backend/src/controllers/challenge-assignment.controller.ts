import { eq, and } from 'drizzle-orm'
import { createDb } from '../db'
import { teamChallengeAssignments } from '../db/schema/team-challenge-assignments'
import { challenges } from '../db/schema/challenges'
import { teams } from '../db/schema/teams'
import { assignChallengesToTeam } from '../services/challenge-assignment.service'
import { getUnlockedLevel } from '../services/level-unlock.service'
import type { AppContext } from '../types'

export async function assignTeamChallenges(c: AppContext) {
  const teamId = Number(c.req.param('teamId'))
  const level = Number(c.req.param('level'))
  const authUser = c.get('user')

  if (!Number.isSafeInteger(teamId) || teamId <= 0) {
    return c.json({ success: false, message: 'Invalid team ID' }, 400)
  }

  // Users can assign challenges for their own team; admins can assign for any team
  if (authUser.role === 'user') {
    const userTeamId = authUser.teamId ?? Number(authUser.id)
    if (userTeamId !== teamId) {
      return c.json(
        { success: false, message: "You cannot assign challenges to another team" },
        403,
      )
    }
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

  let assigned = await db
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

  // Auto-assign challenges for all unlocked levels that haven't been assigned yet
  const unlockedLevel = (await getUnlockedLevel(c, teamId)) ?? 1
  let newlyAssigned = false

  const targetLevels =
    levelParam !== undefined
      ? [Number(levelParam)]
      : Array.from({ length: unlockedLevel }, (_, i) => i + 1)

  for (const lvl of targetLevels) {
    if (lvl >= 1 && lvl <= unlockedLevel) {
      const hasForLevel = assigned.some((a) => a.level === lvl)
      if (!hasForLevel) {
        try {
          const assignRes = await assignChallengesToTeam(c, teamId, lvl)
          if (assignRes.success) {
            newlyAssigned = true
          }
        } catch {
          // ignore auto-assign errors
        }
      }
    }
  }

  if (newlyAssigned) {
    assigned = await db
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
  }

  return c.json({
    success: true,
    data: assigned,
  })
}