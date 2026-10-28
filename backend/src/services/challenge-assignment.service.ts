import { and, eq, inArray } from 'drizzle-orm'
import { createDb } from '../db'
import { challenges } from '../db/schema/challenges'
import { teamChallengeAssignments } from '../db/schema/team-challenge-assignments'
import { teams } from '../db/schema/teams'
import type { AppContext } from '../types'
import { getUnlockedLevel } from './level-unlock.service'

const LEVEL_DIFFICULTIES: Record<number, Record<string, number>> = {
  1: { easy: 2, medium: 1, high: 1 },
  2: { easy: 1, medium: 2, high: 1 },
  3: { medium: 2, high: 2 },
  4: { medium: 1, high: 3 },
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

export async function assignChallengesToTeam(
  c: AppContext,
  teamId: number,
  level: number,
) {
  if (!Number.isInteger(level) || !LEVEL_DIFFICULTIES[level]) {
    return {
      success: false as const,
      message: 'Level must be between 1 and 4',
    }
  }

  const db = createDb(c.env.cec_heist_db)

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  })

 if (!team) {
  return { success: false as const, message: 'Team not found' }
}

const unlockedLevel = await getUnlockedLevel(c, teamId)

if (unlockedLevel === null) {
  return { success: false as const, message: 'Team not found' }
}

if (level > unlockedLevel) {
  return {
    success: false as const,
    message: `Level ${level} is locked. Your team has unlocked up to level ${unlockedLevel}.`,
  }
}

  const existing = await db
    .select({ challengeId: teamChallengeAssignments.challengeId })
    .from(teamChallengeAssignments)
    .where(
      and(
        eq(teamChallengeAssignments.teamId, teamId),
        eq(teamChallengeAssignments.level, level),
      ),
    )

  // Never replace or duplicate an existing level assignment.
  if (existing.length > 0) {
    return {
      success: true as const,
      message: 'Challenges already assigned for this level',
      assignedCount: existing.length,
    }
  }

  const selected = []

  for (const [difficulty, requiredCount] of Object.entries(
    LEVEL_DIFFICULTIES[level],
  )) {
    const candidates = await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.level, level),
          eq(challenges.difficulty, difficulty as 'easy' | 'medium' | 'high'),
        ),
      )

    // Exclude challenges assigned to this team in another level.
    const previouslyAssigned = await db
      .select({ challengeId: teamChallengeAssignments.challengeId })
      .from(teamChallengeAssignments)
      .where(eq(teamChallengeAssignments.teamId, teamId))

    const assignedIds = new Set(
      previouslyAssigned.map((item) => item.challengeId),
    )

    const available = shuffle(
      candidates.filter((challenge) => !assignedIds.has(challenge.id)),
    )

    if (available.length > 0) {
      selected.push(...available.slice(0, requiredCount))
    }
  }

  // If strict difficulty quotas couldn't find 4 challenges,
  // backfill with any remaining unassigned challenges for this level
  if (selected.length < 4) {
    const allLevelCandidates = await db
      .select()
      .from(challenges)
      .where(eq(challenges.level, level))

    const previouslyAssigned = await db
      .select({ challengeId: teamChallengeAssignments.challengeId })
      .from(teamChallengeAssignments)
      .where(eq(teamChallengeAssignments.teamId, teamId))

    const assignedIds = new Set([
      ...previouslyAssigned.map((item) => item.challengeId),
      ...selected.map((item) => item.id),
    ])

    const remainingAvailable = shuffle(
      allLevelCandidates.filter((challenge) => !assignedIds.has(challenge.id)),
    )

    const needed = 4 - selected.length
    selected.push(...remainingAvailable.slice(0, needed))
  }

  if (selected.length === 0) {
    return {
      success: false as const,
      message: `No challenges currently available for level ${level}`,
    }
  }

  await db.insert(teamChallengeAssignments).values(
    selected.map((challenge) => ({
      teamId,
      challengeId: challenge.id,
      level,
    })),
  )

  return {
    success: true as const,
    message: 'Challenges assigned successfully',
    assignedCount: selected.length,
  }
}