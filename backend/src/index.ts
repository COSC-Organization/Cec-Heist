
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import requestLogger from './middlewares/logger'
import { errorHandler } from './middlewares/error-handler'
import leaderboardRoutes from './routes/leaderboard.routes'
import teamsRoutes from './routes/teams.routes'
import loginRoutes from './routes/auth/login.routes'
import challengesRoutes from './routes/challenges.routes'
import type { CloudflareBindings } from './types'
import refreshRoutes from './routes/auth/refresh.routes'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.onError(errorHandler)
app.use('*', requestLogger)

// Allow requests only from the configured frontend origin.
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowedOrigin = c.env.FRONTEND_ORIGIN

      if (origin && origin === allowedOrigin) {
        return origin
      }

      return ''
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
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

// Leaderboard routes
app.route('/api/leaderboard', leaderboardRoutes)

// Team routes
app.route('/api/teams', teamsRoutes)

// Authentication routes
app.route('/api/auth/login', loginRoutes)

// Challenge routes
app.route('/api/challenges', challengesRoutes)

// Refresh token routes
app.route('/api/auth/refresh', refreshRoutes)

export default app
