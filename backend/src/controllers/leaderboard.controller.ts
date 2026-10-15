
import type { Context } from 'hono'
import { asc, count, desc } from 'drizzle-orm'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

type AppContext = Context<{ Bindings: CloudflareBindings }>

export async function getLeaderboard(c: AppContext) {
  const page = Number(c.req.query('page') ?? '1')
  const limit = Number(c.req.query('limit') ?? '10')

  // Validate pagination parameters
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return c.json(
      {
        success: false,
        message: 'Page must be positive and limit must be between 1 and 100',
      },
      400
    )
  }

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
