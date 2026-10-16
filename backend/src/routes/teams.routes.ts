import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'
import { getTeamById } from '../controllers/teams.controller'
import { validatePositiveIntParam } from '../middlewares/validation'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

const teamsRoutes = new Hono<{ Bindings: CloudflareBindings }>()

teamsRoutes.get(
  '/:id',
  validatePositiveIntParam('id'),
  getTeamById
)

export default teamsRoutes