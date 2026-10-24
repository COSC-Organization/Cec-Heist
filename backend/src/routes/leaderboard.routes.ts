
import { Hono } from 'hono'
import {
  getLeaderboard,
  getTeamByRank,
} from '../controllers/leaderboard.controller'
import {
  validatePagination,
  validatePositiveIntParam,
} from '../middlewares/validation'
import { authMiddleware } from '../middlewares/auth'
import { requireUser } from '../middlewares/roles'
import type { CloudflareBindings } from '../types'

const leaderboardRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Both users and admins can view the leaderboard.
leaderboardRoutes.use('*', authMiddleware, requireUser)

leaderboardRoutes.get('/', validatePagination, getLeaderboard)
leaderboardRoutes.get('/:rank', validatePositiveIntParam('rank'), getTeamByRank)

export default leaderboardRoutes
