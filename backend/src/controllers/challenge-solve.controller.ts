
import { and, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { challenges } from '../db/schema/challenges'
import { teams } from '../db/schema/teams'
import { teamChallengeAssignments } from '../db/schema/team-challenge-assignments'
import { teamChallengeSolves } from '../db/schema/team-challenge-solves'
import type { AppContext } from '../types'
import { getUnlockedLevel } from '../services/level-unlock.service'

const POINTS: Record<string, number> = {
  easy: 10,
  medium: 20,
  high: 30,
}

export async function submitChallengeFlag(c: AppContext) {
  const challengeId = Number(c.req.param('challengeId'))
  const db = createDb(c.env.cec_heist_db)

  if (!Number.isSafeInteger(challengeId) || challengeId <= 0) {
    return c.json({ success: false, message: 'Invalid challenge ID' }, 400)
  }

  let body: { flag?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  if (typeof body.flag !== 'string' || !body.flag.trim()) {
    return c.json(
      { success: false, message: 'A valid flag is required' },
      400,
    )
  }

  // Get the authenticated team from the verified JWT.
  const authUser = c.get('user')

  if (authUser.role !== 'user') {
    return c.json(
      { success: false, message: 'A team account is required to submit flags' },
      403,
    )
  }

  const teamId = authUser.teamId ?? Number(authUser.id)

  if (!Number.isSafeInteger(teamId) || teamId <= 0) {
    return c.json(
      { success: false, message: 'No valid team is associated with this account' },
      403,
    )
  }

  // Verify that the challenge is assigned to this team.
  const [assignment] = await db
    .select({
      challengeId: teamChallengeAssignments.challengeId,
      level: teamChallengeAssignments.level,
    })
    .from(teamChallengeAssignments)
    .where(
      and(
        eq(teamChallengeAssignments.teamId, teamId),
        eq(teamChallengeAssignments.challengeId, challengeId),
      ),
    )
    .limit(1)

  if (!assignment) {
    return c.json(
      { success: false, message: 'Challenge is not assigned to this team' },
      403,
    )
  }

  // Verify that the challenge's level is unlocked.
  const unlockedLevel = await getUnlockedLevel(c, teamId)

  if (unlockedLevel === null) {
    return c.json({ success: false, message: 'Team not found' }, 404)
  }

  if (assignment.level > unlockedLevel) {
    return c.json(
      { success: false, message: 'This challenge level is locked' },
      403,
    )
  }

  // Fetch the challenge.
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1)

  if (!challenge) {
    return c.json({ success: false, message: 'Challenge not found' }, 404)
  }

  // Confirm that the team exists.
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)

  if (!team) {
    return c.json({ success: false, message: 'Team not found' }, 404)
  }

  // Return early if this team has already solved the challenge.
  const alreadySolved = await db.query.teamChallengeSolves.findFirst({
    where: and(
      eq(teamChallengeSolves.teamId, teamId),
      eq(teamChallengeSolves.challengeId, challengeId),
    ),
  })

  if (alreadySolved) {
    return c.json({
      success: true,
      message: 'Challenge already solved',
      points_awarded: 0,
      score: team.score,
    })
  }

  // Validate the submitted flag.
  if (body.flag.trim() !== challenge.flag) {
    return c.json({ success: false, message: 'Incorrect flag' }, 400)
  }

  const points = POINTS[challenge.difficulty]

  if (!points) {
    return c.json(
      { success: false, message: 'Challenge difficulty has no point value' },
      500,
    )
  }

  try {
    // Unique marker for this submission.
    const submissionId = crypto.randomUUID()

    /*
     * Run both statements in one transactional D1 batch.
     *
     * The solve is inserted only once. The score increases only
     * if this request inserted the solve record.
     */
    const results = await db.$client.batch([
      db.$client
        .prepare(`
          INSERT INTO team_challenge_solves
            (team_id, challenge_id, points_awarded, submission_id)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(team_id, challenge_id) DO NOTHING
        `)
        .bind(teamId, challengeId, points, submissionId),

      db.$client
        .prepare(`
          UPDATE teams
          SET score = score + ?
          WHERE id = ?
            AND EXISTS (
              SELECT 1
              FROM team_challenge_solves
              WHERE team_id = ?
                AND challenge_id = ?
                AND submission_id = ?
            )
        `)
        .bind(points, teamId, teamId, challengeId, submissionId),
    ])

    const solveInserted = results[0].meta.changes > 0
    const scoreUpdated = results[1].meta.changes > 0

    // Read the current score after the transaction.
    const [currentTeam] = await db
      .select({ score: teams.score })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (!currentTeam) {
      return c.json({ success: false, message: 'Team not found' }, 404)
    }

    // Another concurrent request may have solved it first.
    if (!solveInserted) {
      return c.json({
        success: true,
        message: 'Challenge already solved',
        points_awarded: 0,
        score: currentTeam.score,
      })
    }

    if (!scoreUpdated) {
      console.error('Solve inserted but score update was not confirmed', {
        teamId,
        challengeId,
      })

      return c.json(
        {
          success: false,
          message: 'Unable to confirm score update. Please contact an administrator.',
        },
        500,
      )
    }

    return c.json({
      success: true,
      message: 'Correct flag! Challenge solved.',
      points_awarded: points,
      score: currentTeam.score,
    })
  } catch (error) {
    console.error('Challenge submission failed:', error)

    return c.json(
      {
        success: false,
        message: 'Unable to submit flag. Please retry.',
      },
      500,
    )
  }
}
