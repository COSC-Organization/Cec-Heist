
import { sql } from 'drizzle-orm'
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { teams } from './teams'
import { challenges } from './challenges'

export const teamChallengeAssignments = sqliteTable(
  'team_challenge_assignments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),

    challengeId: integer('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),

    level: integer('level').notNull(),

    assignedAt: text('assigned_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('team_challenge_assignment_unique').on(
      table.teamId,
      table.challengeId,
    ),
  ],
)
