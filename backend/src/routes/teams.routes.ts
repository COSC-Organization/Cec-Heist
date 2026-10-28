import { Hono } from 'hono'
import {
  getAllTeams,
  getTeamById,
  createTeam,
  createTeamsBulk,
  uploadTeamsCSV,
  updateTeam,
  deleteTeam,
} from '../controllers/teams.controller'
import { validatePositiveIntParam } from '../middlewares/validation'
import { authMiddleware } from '../middlewares/auth'
import { requireUser, requireAdmin } from '../middlewares/roles'
import type { CloudflareBindings } from '../types'

const teamsRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Both users and admins must authenticate to access team routes.
teamsRoutes.use('*', authMiddleware)

// Admin can list all teams.
teamsRoutes.get('/', requireAdmin, getAllTeams)

// Both roles can view team details.
teamsRoutes.get('/:id', requireUser, validatePositiveIntParam('id'), getTeamById)

// Only admins can modify team data.
teamsRoutes.post('/', requireAdmin, createTeam)
teamsRoutes.post('/bulk', requireAdmin, createTeamsBulk)
teamsRoutes.post('/bulk-csv', requireAdmin, uploadTeamsCSV)
teamsRoutes.post('/upload-csv', requireAdmin, uploadTeamsCSV)
teamsRoutes.patch('/:id', requireAdmin, validatePositiveIntParam('id'), updateTeam)
teamsRoutes.delete('/:id', requireAdmin, validatePositiveIntParam('id'), deleteTeam)

export default teamsRoutes
