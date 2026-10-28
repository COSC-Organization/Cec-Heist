import { and, asc, count, desc, eq, gt, lt, or } from 'drizzle-orm'
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

export async function getTeamRankById(c: AppContext) {
  const teamId = Number(c.req.param('teamId'))

  if (!teamId || isNaN(teamId) || teamId <= 0) {
    return c.json(
      {
        success: false,
        message: 'Invalid team ID',
      },
      400
    )
  }

  const db = createDb(c.env.cec_heist_db)

  const targetTeam = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  })

  if (!targetTeam) {
    return c.json(
      {
        success: false,
        message: 'Team not found',
      },
      404
    )
  }

  // Count teams strictly ahead in the leaderboard:
  // 1. Higher score
  // 2. Same score but lower team ID
  const [{ higherCount }] = await db
    .select({ higherCount: count() })
    .from(teams)
    .where(
      or(
        gt(teams.score, targetTeam.score),
        and(eq(teams.score, targetTeam.score), lt(teams.id, targetTeam.id))
      )
    )

  const [{ total }] = await db
    .select({ total: count() })
    .from(teams)

  const rank = higherCount + 1
  const limit = Math.max(1, Math.min(100, Number(c.req.query('limit') ?? '10')))
  const page = Math.ceil(rank / limit)

  return c.json({
    success: true,
    data: {
      id: targetTeam.id,
      team_name: targetTeam.teamName,
      score: targetTeam.score,
      rank,
      totalTeams: total,
      page,
      limit,
    },
  })
}

export async function getMyRank(c: AppContext) {
  const authUser = c.get('user')
  const teamId =
    authUser?.teamId ||
    (!isNaN(Number(authUser?.id)) ? Number(authUser?.id) : null)

  if (!teamId) {
    return c.json(
      {
        success: false,
        message: 'No team associated with current account',
      },
      400
    )
  }

  const db = createDb(c.env.cec_heist_db)

  const targetTeam = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  })

  if (!targetTeam) {
    return c.json(
      {
        success: false,
        message: 'Squad record not found in competition database',
      },
      404
    )
  }

  const [{ higherCount }] = await db
    .select({ higherCount: count() })
    .from(teams)
    .where(
      or(
        gt(teams.score, targetTeam.score),
        and(eq(teams.score, targetTeam.score), lt(teams.id, targetTeam.id))
      )
    )

  const [{ total }] = await db
    .select({ total: count() })
    .from(teams)

  const rank = higherCount + 1
  const limit = Math.max(1, Math.min(100, Number(c.req.query('limit') ?? '10')))
  const page = Math.ceil(rank / limit)

  return c.json({
    success: true,
    data: {
      id: targetTeam.id,
      team_name: targetTeam.teamName,
      score: targetTeam.score,
      rank,
      totalTeams: total,
      page,
      limit,
    },
  })
}
