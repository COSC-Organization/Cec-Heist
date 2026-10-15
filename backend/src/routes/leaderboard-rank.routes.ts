
import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { getTeamByRank } from '../controllers/leaderboard-rank.controller'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

const leaderboardRankRoutes = new Hono<{
  Bindings: CloudflareBindings
}>()

leaderboardRankRoutes.get('/:rank', getTeamByRank)

export default leaderboardRankRoutes
