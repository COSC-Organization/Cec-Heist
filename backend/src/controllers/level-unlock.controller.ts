
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'
import { users } from '../db/schema/users'
import { getUnlockedLevel } from '../services/level-unlock.service'
import type { AppContext } from '../types'

export async function getTeamLevelStatus(c: AppContext) {
  const requestedTeamId = Number(c.req.param('teamId'))

  if (!Number.isSafeInteger(requestedTeamId) || requestedTeamId <= 0) {
    return c.json(
      { success: false, message: 'Invalid team ID' },
      400,
    )
  }

  const db = createDb(c.env.cec_heist_db)
  const authUser = c.get('user')

  // Regular users can access only their own team's status.
  if (authUser.role === 'user') {
    const [user] = await db
      .select({
        teamId: users.teamId,
      })
      .from(users)
      .where(eq(users.id, Number(authUser.id)))
      .limit(1)

    if (!user) {
      return c.json(
        { success: false, message: 'User not found' },
        404,
      )
    }

    if (user.teamId === null || user.teamId !== requestedTeamId) {
      return c.json(
        { success: false, message: 'You cannot access another team\'s status' },
        403,
      )
    }
  }

  // Admins can view any existing team's status.
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, requestedTeamId),
  })

  if (!team) {
    return c.json(
      { success: false, message: 'Team not found' },
      404,
    )
  }

  const unlockedLevel = await getUnlockedLevel(c, requestedTeamId)

  return c.json({
    success: true,
    data: {
      team_id: team.id,
      score: team.score,
      unlocked_level: unlockedLevel,
      levels: [
        { level: 1, required_score: 0, unlocked: true },
        { level: 2, required_score: 30, unlocked: team.score >= 30 },
        { level: 3, required_score: 70, unlocked: team.score >= 70 },
        {
          level: 4,
          required_score: null,
          unlocked: false,
          message: 'Level 4 threshold needs confirmation',
        },
      ],
    },
  })
}
