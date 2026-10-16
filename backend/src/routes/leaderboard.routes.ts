import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { getLeaderboard } from '../controllers/leaderboard.controller'
import { validatePagination } from '../middlewares/validation'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

const leaderboardRoutes = new Hono<{ Bindings: CloudflareBindings }>()

leaderboardRoutes.get('/', validatePagination, getLeaderboard)

export default leaderboardRoutes