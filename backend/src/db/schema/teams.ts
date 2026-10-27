
import { sql } from 'drizzle-orm'
import {
  integer,
  index,
  uniqueIndex,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const teams = sqliteTable(
  'teams',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teamName: text('team_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    score: integer('score').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('score_idx').on(table.score),
    uniqueIndex('teams_team_name_unique').on(table.teamName),
  ]
)
