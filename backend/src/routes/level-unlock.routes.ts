import { Hono } from 'hono'
import { getTeamLevelStatus } from '../controllers/level-unlock.controller'
import { authMiddleware } from '../middlewares/auth'
import { requireUser } from '../middlewares/roles'
import { validatePositiveIntParam } from '../middlewares/validation'
import type { CloudflareBindings } from '../types'

const routes = new Hono<{ Bindings: CloudflareBindings }>()

routes.use('*', authMiddleware)

routes.get(
  '/:teamId',
  requireUser,
  validatePositiveIntParam('teamId'),
  getTeamLevelStatus,
)

export default routes