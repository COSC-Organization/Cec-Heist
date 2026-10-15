
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { D1Database } from '@cloudflare/workers-types'

import leaderboardRoutes from './routes/leaderboard.routes'
import leaderboardRankRoutes from './routes/leaderboard-rank.routes'
import teamsRoutes from './routes/teams.routes'

type CloudflareBindings = {
  cec_heist_db: D1Database
}

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Allow the local Next.js frontend to call the backend
app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Root endpoint
app.get('/', (c) => {
  return c.text('CEC HEIST Backend')
})

// Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'CEC HEIST backend is running',
  })
})

// Get all teams
app.route('/api/leaderboard', leaderboardRoutes)

// Get a team by rank
app.route('/api/leaderboard', leaderboardRankRoutes)

// Get a team by database ID
app.route('/api/teams', teamsRoutes)

export default app
