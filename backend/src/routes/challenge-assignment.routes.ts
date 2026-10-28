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

// Authenticated assignment endpoint (admin or owning team).
routes.post(
  '/:teamId/levels/:level/assign',
  requireUser,
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