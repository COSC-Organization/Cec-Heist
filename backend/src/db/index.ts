
import { drizzle } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'
import * as teamsSchema from './schema/teams'
import * as usersSchema from './schema/users'
import * as challengesSchema from './schema/challenges'

const schema = {
  ...teamsSchema,
  ...usersSchema,
  ...challengesSchema,
}

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}
