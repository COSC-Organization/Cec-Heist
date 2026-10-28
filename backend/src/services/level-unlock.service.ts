import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'
import type { AppContext } from '../types'

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 30,
  3: 70,
  4: 120,
}

export async function getUnlockedLevel(
  c: AppContext,
  teamId: number,
): Promise<number | null> {
  const db = createDb(c.env.cec_heist_db)

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  })

  if (!team) return null

  let unlockedLevel = 1

  for (const level of [2, 3, 4]) {
    if (team.score >= LEVEL_THRESHOLDS[level]) {
      unlockedLevel = level
    } else {
      break
    }
  }

  return unlockedLevel
}