import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { challenges } from '../db/schema/challenges'
import type { AppContext } from '../types'

const allowedDifficulties = ['easy', 'medium', 'high'] as const

export async function getAllChallenges(c: AppContext) {
  const db = createDb(c.env.cec_heist_db)
  const all = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      description: challenges.description,
      flag: challenges.flag,
      hintUrl: challenges.hintUrl,
      level: challenges.level,
      difficulty: challenges.difficulty,
      createdAt: challenges.createdAt,
    })
    .from(challenges)
    .orderBy(challenges.id)

  return c.json({
    success: true,
    data: all,
  })
}

export async function createChallenge(c: AppContext) {
  let body: {
    title?: unknown
    description?: unknown
    flag?: unknown
    hintUrl?: unknown
    level?: unknown
    difficulty?: unknown
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json(
      { success: false, message: 'Invalid JSON body' },
      400
    )
  }

  const { title, description, flag, hintUrl, level, difficulty } = body

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > 150 ||
    typeof description !== 'string' ||
    !description.trim() ||
    description.length > 5000 ||
    typeof flag !== 'string' ||
    !flag.trim() ||
    flag.length > 500 ||
    !Number.isInteger(level) ||
    typeof level !== 'number' ||
    level < 1 ||
    level > 4 ||
    typeof difficulty !== 'string' ||
    !allowedDifficulties.includes(
      difficulty as (typeof allowedDifficulties)[number]
    )
  ) {
    return c.json(
      { success: false, message: 'Invalid challenge fields' },
      400
    )
  }

  let normalizedHintUrl: string | null = null

  if (hintUrl !== undefined && hintUrl !== null && hintUrl !== '') {
    if (typeof hintUrl !== 'string' || hintUrl.length > 2048) {
      return c.json(
        { success: false, message: 'Invalid hint URL' },
        400
      )
    }

    try {
      const url = new URL(hintUrl)

      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Unsupported URL protocol')
      }

      normalizedHintUrl = url.toString()
    } catch {
      return c.json(
        { success: false, message: 'Hint must be a valid HTTP or HTTPS URL' },
        400
      )
    }
  }

  try {
    const db = createDb(c.env.cec_heist_db)

    const [created] = await db
      .insert(challenges)
      .values({
        title: title.trim(),
        description: description.trim(),
        flag: flag.trim(),
        hintUrl: normalizedHintUrl,
        level,
        difficulty: difficulty as 'easy' | 'medium' | 'high',
      })
      .returning({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        hintUrl: challenges.hintUrl,
        level: challenges.level,
        difficulty: challenges.difficulty,
        createdAt: challenges.createdAt,
      })

    // Never return the flag in the API response.
    return c.json(
      {
        success: true,
        message: 'Challenge created successfully',
        data: created,
      },
      201
    )
  } catch (error) {
    console.error('Challenge creation failed:', error)
    return c.json(
      { success: false, message: 'Unable to create challenge' },
      500
    )
  }
}

export async function deleteChallenge(c: AppContext) {
  const id = Number(c.req.param('id'))
  if (!Number.isSafeInteger(id) || id <= 0) {
    return c.json({ success: false, message: 'Invalid challenge ID' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)
    const [deleted] = await db
      .delete(challenges)
      .where(eq(challenges.id, id))
      .returning({ id: challenges.id })

    if (!deleted) {
      return c.json({ success: false, message: 'Challenge not found' }, 404)
    }

    return c.json({ success: true, message: 'Challenge deleted successfully' })
  } catch (error) {
    console.error('Delete challenge failed:', error)
    return c.json({ success: false, message: 'Unable to delete challenge' }, 500)
  }
}
