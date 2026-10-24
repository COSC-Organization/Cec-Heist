
import { Hono } from 'hono'
import { createChallenge } from '../controllers/challenges.controller'
import { authMiddleware } from '../middlewares/auth'
import { requireAdmin } from '../middlewares/roles'
import type { CloudflareBindings } from '../types'

const challengesRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Only authenticated admins can manage challenges.
challengesRoutes.use('*', authMiddleware, requireAdmin)

challengesRoutes.post('/', createChallenge)

export default challengesRoutes
