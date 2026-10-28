import { Hono } from 'hono'
import { submitChallengeFlag } from '../controllers/challenge-solve.controller'
import { authMiddleware } from '../middlewares/auth'
import { requireUser } from '../middlewares/roles'
import type { CloudflareBindings } from '../types'

const routes = new Hono<{ Bindings: CloudflareBindings }>()

routes.use('*', authMiddleware)

routes.post('/:challengeId/submit', requireUser, submitChallengeFlag)

export default routes