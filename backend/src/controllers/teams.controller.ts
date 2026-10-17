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
    return c.json(
      {
        success: false,
        message: 'Team not found',
      },
      404
    )
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