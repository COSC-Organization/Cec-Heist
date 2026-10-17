import { asc, count, desc } from 'drizzle-orm'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'
import type { AppContext } from '../types'

export async function getLeaderboard(c: AppContext) {
  const page = Number(c.req.query('page') ?? '1')
  const limit = Number(c.req.query('limit') ?? '10')

  const db = createDb(c.env.cec_heist_db)
  const offset = (page - 1) * limit

  // Fetch the requested page of teams
  const pageTeams = await db
    .select()
    .from(teams)
    .orderBy(desc(teams.score), asc(teams.id))
    .limit(limit)
    .offset(offset)

  // Count all teams
  const [{ total }] = await db
    .select({ total: count() })
    .from(teams)

  // Calculate each team's overall rank
  const rankedTeams = pageTeams.map((team, index) => ({
    rank: offset + index + 1,
    id: team.id,
    team_name: team.teamName,
    score: team.score,
  }))

  return c.json({
    success: true,
    data: rankedTeams,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function getTeamByRank(c: AppContext) {
  const rank = Number(c.req.param('rank'))

  const db = createDb(c.env.cec_heist_db)

  const team = await db.query.teams.findFirst({
    orderBy: [desc(teams.score), asc(teams.id)],
    offset: rank - 1,
  })

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