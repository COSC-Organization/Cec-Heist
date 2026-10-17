import { Hono } from 'hono'
import { getLeaderboard, getTeamByRank } from '../controllers/leaderboard.controller'
import { validatePagination, validatePositiveIntParam } from '../middlewares/validation'
import type { CloudflareBindings } from '../types'

const leaderboardRoutes = new Hono<{ Bindings: CloudflareBindings }>()

leaderboardRoutes.get('/', validatePagination, getLeaderboard)
leaderboardRoutes.get('/:rank', validatePositiveIntParam('rank'), getTeamByRank)

export default leaderboardRoutes