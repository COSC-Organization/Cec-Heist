import type { Context } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

export type CloudflareBindings = {
  cec_heist_db: D1Database
  JWT_SECRET: string
  FRONTEND_ORIGIN: string
}

export type AppContext = Context<{ Bindings: CloudflareBindings }>

export type Team = {
  id: number
  team_name: string
  score: number
}

export type RankedTeam = Team & {
  rank: number
}
