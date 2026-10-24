
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const challenges = sqliteTable('challenges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  flag: text('flag').notNull(),
  hintUrl: text('hint_url'),
  level: integer('level').notNull(),
  difficulty: text('difficulty', {
    enum: ['easy', 'medium', 'high'],
  }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})
