import type { Context } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

export type CloudflareBindings = {
  cec_heist_db: D1Database
  JWT_SECRET: string
  FRONTEND_ORIGIN: string
}

export type AuthUser = {
  id: string
  email: string
  role: 'user' | 'admin'
  teamId?: number
  teamName?: string
}

export type AppVariables = {
  user: AuthUser
}

export type AppContext = Context<{
  Bindings: CloudflareBindings
  Variables: AppVariables
}>

export type Team = {
  id: number
  team_name: string
  score: number
}

export type RankedTeam = Team & {
  rank: number
}