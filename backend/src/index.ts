
import { Hono } from 'hono'
import { cors } from 'hono/cors'

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

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'CEC HEIST backend is running',
  })
})

// Get all teams ordered by score
app.get('/api/leaderboard', async (c) => {
  const { results } = await c.env.cec_heist_db
    .prepare(
      'SELECT id, team_name, score FROM teams ORDER BY score DESC'
    )
    .all()

  const rankedResults = results.map((team, index) => ({
    rank: index + 1,
    ...team,
  }))

  return c.json({
    success: true,
    data: rankedResults,
  })
})

// Get a team by its leaderboard rank
app.get('/api/leaderboard/:rank', async (c) => {
  const rank = Number(c.req.param('rank'))

  // Validate rank
  if (!Number.isInteger(rank) || rank < 1) {
    return c.json(
      {
        success: false,
        message: 'Rank must be a positive integer',
      },
      400
    )
  }

  // Fetch the team at the requested rank
  const { results } = await c.env.cec_heist_db
    .prepare(
      'SELECT id, team_name, score FROM teams ORDER BY score DESC LIMIT 1 OFFSET ?'
    )
    .bind(rank - 1)
    .all()

  // Handle missing rank
  if (results.length === 0) {
    return c.json(
      {
        success: false,
        message: 'Team rank not found',
      },
      404
    )
  }

  return c.json({
    success: true,
    rank,
    data: results[0],
  })
})

// Get a team by its database ID
app.get('/api/teams/:id', async (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id < 1) {
    return c.json(
      {
        success: false,
        message: 'Team ID must be a positive integer',
      },
      400
    )
  }

  const team = await c.env.cec_heist_db
    .prepare(
      'SELECT id, team_name, score FROM teams WHERE id = ?'
    )
    .bind(id)
    .first()

  if (!team) {
    return c.json(
      {
        success: false,
        message: 'Team not found',
      },
      404
    )
  }

  return c.json({
    success: true,
    data: team,
  })
})

export default app
