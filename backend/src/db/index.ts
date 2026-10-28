
import { drizzle } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'
import * as teamsSchema from './schema/teams'
import * as usersSchema from './schema/users'
import * as challengesSchema from './schema/challenges'
import * as assignmentsSchema from './schema/team-challenge-assignments'
import * as solvesSchema from './schema/team-challenge-solves'


const schema = {
  ...teamsSchema,
  ...usersSchema,
  ...challengesSchema,
  ...assignmentsSchema,
  ...solvesSchema,
}

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}
