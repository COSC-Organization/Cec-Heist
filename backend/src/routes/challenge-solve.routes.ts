import { Hono } from 'hono'
import {
  submitChallengeFlag,
  getTeamSolves,
} from '../controllers/challenge-solve.controller'
import { authMiddleware } from '../middlewares/auth'
import { requireUser } from '../middlewares/roles'
import { validatePositiveIntParam } from '../middlewares/validation'
import type { CloudflareBindings } from '../types'

const routes = new Hono<{ Bindings: CloudflareBindings }>()

routes.use('*', authMiddleware)

routes.post('/:challengeId/submit', requireUser, submitChallengeFlag)
routes.get(
  '/:teamId',
  requireUser,
  validatePositiveIntParam('teamId'),
  getTeamSolves
)

export default routes