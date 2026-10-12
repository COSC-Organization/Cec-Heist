import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('CEC HEIST Backend')
})

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'CEC HEIST backend is running',
  })
})

export default app