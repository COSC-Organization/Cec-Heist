
import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { getLeaderboard } from '../controllers/leaderboard.controller'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

const leaderboardRoutes = new Hono<{ Bindings: CloudflareBindings }>()

leaderboardRoutes.get('/', getLeaderboard)

export default leaderboardRoutes
