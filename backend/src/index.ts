
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
import challengeAssignmentRoutes from './routes/challenge-assignment.routes'
import challengeSolveRoutes from './routes/challenge-solve.routes'
import levelUnlockRoutes from './routes/level-unlock.routes'

const isAllowedOrigin = (origin: string, envOrigin?: string): boolean => {
  if (!origin) return false

  const cleanOrigin = origin.trim().toLowerCase().replace(/\/+$/, '')

  // 1. Explicit environment variable check (supports single or comma-separated origins)
  if (envOrigin) {
    const configuredOrigins = envOrigin
      .split(',')
      .map((o) => o.trim().toLowerCase().replace(/\/+$/, ''))
      .filter(Boolean)
    if (configuredOrigins.includes(cleanOrigin)) {
      return true
    }
  }

  // 2. Production frontend & backend origins
  if (
    cleanOrigin === 'https://cec-heist.cosc25.in' ||
    cleanOrigin === 'https://cec-heist-backend.cosc25.in'
  ) {
    return true
  }

  // Allow subdomains on cosc25.in over HTTPS (e.g. preview/staging environments)
  if (/^https:\/\/([a-z0-9-]+\.)*cosc25\.in$/.test(cleanOrigin)) {
    return true
  }

  // 3. Local development origins
  if (
    cleanOrigin === 'http://localhost:3000' ||
    cleanOrigin === 'http://127.0.0.1:3000' ||
    cleanOrigin === 'http://localhost:8787' ||
    cleanOrigin === 'http://localhost:8788'
  ) {
    return true
  }

  return false
}

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.onError(errorHandler)
app.use('*', requestLogger)

// Global CORS Middleware configured for production & local development
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (isAllowedOrigin(origin, c.env.FRONTEND_ORIGIN)) {
        return origin
      }
      return null
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposeHeaders: ['Content-Length', 'X-Total-Count'],
    credentials: true,
    maxAge: 86400,
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

// Challenge assignment routes
app.route('/api/challenge-assignments', challengeAssignmentRoutes)

// Challenge solve routes
app.route('/api/challenge-solves', challengeSolveRoutes)

// Level unlock routes
app.route('/api/level-unlocks', levelUnlockRoutes)

export { app }
export default app
