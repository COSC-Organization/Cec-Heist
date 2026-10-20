
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import requestLogger from './middlewares/logger'
import { errorHandler } from './middlewares/error-handler'
import leaderboardRoutes from './routes/leaderboard.routes'
import teamsRoutes from './routes/teams.routes'
import type { CloudflareBindings } from './types'
import loginRoutes from './routes/auth/login.routes'
import challengesRoutes from './routes/challenges.routes'


const app = new Hono<{ Bindings: CloudflareBindings }>()

app.onError(errorHandler)
app.use('*', requestLogger)

// Allow the local Next.js frontend to call the backend
app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:3000',
    allowMethods: ['GET', 'POST','PATCH', 'PUT', 'DELETE', 'OPTIONS'],
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

// Leaderboard routes (/api/leaderboard and /api/leaderboard/:rank)
app.route('/api/leaderboard', leaderboardRoutes)

// Teams routes (/api/teams/:id)
app.route('/api/teams', teamsRoutes)

// Auth routes (/api/auth/login)
app.route('/api/auth/login', loginRoutes)

// Challenges routes (/api/challenges)
app.route('/api/challenges', challengesRoutes)

export default app
