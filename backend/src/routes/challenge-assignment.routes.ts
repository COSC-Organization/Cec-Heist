import { Hono } from 'hono'
import {
  assignTeamChallenges,
  getTeamAssignedChallenges,
} from '../controllers/challenge-assignment.controller'
import { authMiddleware } from '../middlewares/auth'
import { requireAdmin, requireUser } from '../middlewares/roles'
import { validatePositiveIntParam } from '../middlewares/validation'
import type { CloudflareBindings } from '../types'

const routes = new Hono<{ Bindings: CloudflareBindings }>()

routes.use('*', authMiddleware)

// Admin-only assignment endpoint.
routes.post(
  '/:teamId/levels/:level/assign',
  requireAdmin,
  validatePositiveIntParam('teamId'),
  validatePositiveIntParam('level'),
  assignTeamChallenges,
)

// Authenticated team challenge listing.
routes.get(
  '/:teamId',
  requireUser,
  validatePositiveIntParam('teamId'),
  getTeamAssignedChallenges,
)

export default routes