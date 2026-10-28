import { sql } from 'drizzle-orm'
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { teams } from './teams'
import { challenges } from './challenges'

export const teamChallengeSolves = sqliteTable(
  'team_challenge_solves',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    challengeId: integer('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),
    pointsAwarded: integer('points_awarded').notNull(),
    solvedAt: text('solved_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    submissionId: text('submission_id'),
  },
  (table) => [
    uniqueIndex('team_challenge_solve_unique').on(
      table.teamId,
      table.challengeId,
    ),
  ],
)