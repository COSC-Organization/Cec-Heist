import { Hono } from 'hono'
import { getTeamById } from '../controllers/teams.controller'
import { validatePositiveIntParam } from '../middlewares/validation'
import type { CloudflareBindings } from '../types'

const teamsRoutes = new Hono<{ Bindings: CloudflareBindings }>()

teamsRoutes.get('/:id', validatePositiveIntParam('id'), getTeamById)

export default teamsRoutes