import { Hono } from 'hono'
import {
  createChallenge,
  getAllChallenges,
  deleteChallenge,
} from '../controllers/challenges.controller'
import { authMiddleware } from '../middlewares/auth'
import { requireAdmin } from '../middlewares/roles'
import { validatePositiveIntParam } from '../middlewares/validation'
import type { CloudflareBindings } from '../types'

const challengesRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Only authenticated admins can manage challenges.
challengesRoutes.use('*', authMiddleware, requireAdmin)

challengesRoutes.get('/', getAllChallenges)
challengesRoutes.post('/', createChallenge)
challengesRoutes.delete('/:id', validatePositiveIntParam('id'), deleteChallenge)

export default challengesRoutes
