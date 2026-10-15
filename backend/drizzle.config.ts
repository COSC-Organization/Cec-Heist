import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/teams.ts',
  out: './drizzle',
  dialect: 'sqlite',
})