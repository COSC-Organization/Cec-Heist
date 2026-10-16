import type { Context } from 'hono'
import { asc, desc } from 'drizzle-orm'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

type AppContext = Context<{ Bindings: CloudflareBindings }>

export async function getTeamByRank(c: AppContext) {
  const rank = Number(c.req.param('rank'))

  const db = createDb(c.env.cec_heist_db)

  const rankedTeams = await db
    .select()
    .from(teams)
    .orderBy(desc(teams.score), asc(teams.id))
    .limit(1)
    .offset(rank - 1)

  const team = rankedTeams[0]

  if (!team) {
    return c.json(
      {
        success: false,
        message: 'Team rank not found',
      },
      404
    )
  }

  return c.json({
    success: true,
    rank,
    data: {
      id: team.id,
      team_name: team.teamName,
      score: team.score,
    },
  })
}