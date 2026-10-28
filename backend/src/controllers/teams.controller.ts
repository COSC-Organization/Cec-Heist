import { eq, sql } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { createDb } from '../db'
import { teams } from '../db/schema/teams'
import type { AppContext } from '../types'

export async function getAllTeams(c: AppContext) {
  const db = createDb(c.env.cec_heist_db)
  const allTeams = await db
    .select({
      id: teams.id,
      team_name: teams.teamName,
      score: teams.score,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .orderBy(teams.id)

  return c.json({
    success: true,
    data: allTeams,
  })
}

export async function getTeamById(c: AppContext) {
  const id = Number(c.req.param('id'))
  const db = createDb(c.env.cec_heist_db)

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, id),
  })

  if (!team) {
    return c.json({ success: false, message: 'Team not found' }, 404)
  }

  return c.json({
    success: true,
    data: {
      id: team.id,
      team_name: team.teamName,
      score: team.score,
      createdAt: team.createdAt,
    },
  })
}

export async function createTeam(c: AppContext) {
  let body: { team_name?: unknown; password?: unknown; score?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const rawIdentifier = (
    (typeof body.team_name === 'string' && body.team_name) ||
    (typeof body.email === 'string' && body.email) ||
    (typeof body.leader_email === 'string' && body.leader_email) ||
    ''
  ).trim()

  if (
    !rawIdentifier ||
    rawIdentifier.length > 254
  ) {
    return c.json({ success: false, message: 'team_name or email must be 1–254 characters' }, 400)
  }

  const teamName = rawIdentifier
  const password = typeof body.password === 'string' ? body.password.trim() : ''

  if (!password || password.length < 4 || new TextEncoder().encode(password).length > 72) {
    return c.json(
      { success: false, message: 'password is required and must be between 4 and 72 characters' },
      400
    )
  }

  const score = body.score ?? 0
  if (!Number.isSafeInteger(score) || (score as number) < 0) {
    return c.json({ success: false, message: 'score must be a non-negative integer' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)

    // Check if team name already exists
    const existing = await db.query.teams.findFirst({
      where: eq(sql`lower(${teams.teamName})`, teamName.toLowerCase()),
    })

    if (existing) {
      return c.json(
        { success: false, message: 'A team with this name already exists' },
        409
      )
    }

    const passwordHash = await hash(password, 10)

    const [team] = await db
      .insert(teams)
      .values({
        teamName,
        passwordHash,
        score: score as number,
      })
      .returning({
        id: teams.id,
        teamName: teams.teamName,
        score: teams.score,
        createdAt: teams.createdAt,
      })

    return c.json(
      {
        success: true,
        data: {
          id: team.id,
          team_name: team.teamName,
          score: team.score,
          createdAt: team.createdAt,
        },
      },
      201
    )
  } catch (error) {
    console.error('Create team failed:', error)
    const errStr = String(error)
    if (errStr.includes('UNIQUE constraint failed') || errStr.includes('teams_team_name_unique')) {
      return c.json({ success: false, message: 'A team with this name already exists' }, 409)
    }
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unable to create team',
      },
      500
    )
  }
}

export async function createTeamsBulk(c: AppContext) {
  let body: { teams?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const inputTeams = Array.isArray(body?.teams)
    ? body.teams
    : Array.isArray(body)
    ? body
    : null

  if (!inputTeams || inputTeams.length === 0) {
    return c.json(
      { success: false, message: 'An array of teams is required' },
      400
    )
  }

  const db = createDb(c.env.cec_heist_db)
  const created: Array<{ id: number; team_name: string; score: number }> = []
  const errors: Array<{ team_name?: string; reason: string }> = []

  for (const item of inputTeams) {
    const rawIdentifier = (
      (typeof item?.email === 'string' && item.email) ||
      (typeof item?.leader_email === 'string' && item.leader_email) ||
      (typeof item?.team_name === 'string' && item.team_name) ||
      ''
    ).trim()
    const password = typeof item?.password === 'string' ? item.password.trim() : 'HEIST2026'
    const score = Number.isSafeInteger(item?.score) && item.score >= 0 ? item.score : 0

    if (!rawIdentifier || rawIdentifier.length > 254) {
      errors.push({
        team_name: rawIdentifier,
        reason: 'Team identifier must be 1–254 characters',
      })
      continue
    }

    const teamName = rawIdentifier

    try {
      const existing = await db.query.teams.findFirst({
        where: eq(sql`lower(${teams.teamName})`, teamName.toLowerCase()),
      })

      if (existing) {
        errors.push({ team_name: teamName, reason: 'Team name already exists' })
        continue
      }

      const passwordHash = await hash(password, 10)
      const [newTeam] = await db
        .insert(teams)
        .values({
          teamName,
          passwordHash,
          score,
        })
        .returning({
          id: teams.id,
          teamName: teams.teamName,
          score: teams.score,
        })

      created.push({
        id: newTeam.id,
        team_name: newTeam.teamName,
        score: newTeam.score,
      })
    } catch {
      errors.push({ team_name: teamName, reason: 'Database insertion error' })
    }
  }

  return c.json(
    {
      success: true,
      count: created.length,
      data: created,
      errors: errors.length > 0 ? errors : undefined,
    },
    201
  )
}

/**
 * Parse CSV content into an array of string fields per row.
 * Conforms to RFC 4180: handles commas within quotes, escaped double quotes (""),
 * strips UTF-8 BOM, and standardizes CRLF/LF line breaks.
 */
function parseCsvContent(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]

    if (char === '"') {
      if (inQuotes && clean[i + 1] === '"') {
        field += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field.trim())
      field = ''
    } else if (char === '\n' && !inQuotes) {
      row.push(field.trim())
      if (row.some((c) => c.length > 0)) {
        rows.push(row)
      }
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim())
    if (row.some((c) => c.length > 0)) {
      rows.push(row)
    }
  }

  return rows
}

/**
 * Bulk upload and register teams directly from a CSV file or payload.
 * Supports multipart/form-data, text/csv, and JSON bodies.
 * Automatically identifies columns (team name, password, score).
 * Protected: Admin only.
 */
export async function uploadTeamsCSV(c: AppContext) {
  const contentType = c.req.header('content-type') || ''
  let rawCsv = ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData()
      const file = formData.get('file') || formData.get('csv')
      if (file && typeof file === 'object' && 'text' in file) {
        rawCsv = await file.text()
      } else if (typeof file === 'string') {
        rawCsv = file
      }
    } else if (contentType.includes('application/json')) {
      const json = await c.req.json()
      rawCsv = json.csv || json.content || ''
    } else {
      rawCsv = await c.req.text()
    }
  } catch (err) {
    return c.json(
      {
        success: false,
        message: `Failed to read CSV payload: ${err instanceof Error ? err.message : String(err)}`,
      },
      400
    )
  }

  if (!rawCsv || !rawCsv.trim()) {
    return c.json(
      { success: false, message: 'CSV content or file is empty or missing' },
      400
    )
  }

  const rows = parseCsvContent(rawCsv)
  if (rows.length === 0) {
    return c.json(
      { success: false, message: 'No valid data rows detected in CSV' },
      400
    )
  }

  // Determine column mapping by examining the first row
  const firstRow = rows[0].map((cell) =>
    cell.toLowerCase().replace(/[\s_\-"']/g, '')
  )
  const leaderEmailKeywords = [
    'teamleaderemail',
    'leaderemail',
    'teamleademail',
    'captainemail',
    'leademail',
    'emailaddress',
    'contactemail',
    'email',
    'mail',
  ]
  const teamNameKeywords = [
    'teamname',
    'team',
    'name',
    'squadname',
    'squad',
    'teams',
    'squads',
  ]
  const passwordKeywords = [
    'password',
    'passcode',
    'pass',
    'pwd',
    'secret',
    'teampassword',
  ]
  const scoreKeywords = ['score', 'points', 'pts']

  let leaderEmailIdx = firstRow.findIndex((c) => leaderEmailKeywords.includes(c))
  let teamNameIdx = firstRow.findIndex((c) => teamNameKeywords.includes(c))
  let passwordIdx = firstRow.findIndex((c) => passwordKeywords.includes(c))
  let scoreIdx = firstRow.findIndex((c) => scoreKeywords.includes(c))

  // Prioritize team leader's email over team name
  const primaryIdx = leaderEmailIdx !== -1 ? leaderEmailIdx : teamNameIdx

  let dataRows: string[][]
  if (primaryIdx !== -1 || passwordIdx !== -1 || scoreIdx !== -1) {
    dataRows = rows.slice(1)
    if (passwordIdx === -1 && rows[0].length > 1) {
      // If header doesn't explicitly match password, check if 2nd column or last column
      passwordIdx = primaryIdx === 0 && rows[0].length === 2 ? 1 : rows[0].length - 1
    }
  } else {
    // Headerless CSV: detect if col 0 or 1 contains '@'
    const col0HasEmail = rows[0][0] && rows[0][0].includes('@')
    const col1HasEmail = rows[0][1] && rows[0][1].includes('@')
    if (col1HasEmail && !col0HasEmail) {
      leaderEmailIdx = 1
      passwordIdx = 0
    } else {
      leaderEmailIdx = 0
      passwordIdx = rows[0].length > 1 ? 1 : -1
    }
    dataRows = rows
  }

  if (dataRows.length === 0) {
    return c.json(
      {
        success: false,
        message: 'CSV file contains headers but no data rows',
      },
      400
    )
  }

  const db = createDb(c.env.cec_heist_db)
  const created: Array<{ id: number; team_name: string; score: number }> = []
  const errors: Array<{ row: number; team_name?: string; reason: string }> = []
  const seenInBatch = new Set<string>()

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = (primaryIdx !== -1 || passwordIdx !== -1 || scoreIdx !== -1) ? i + 2 : i + 1

    // Extract team leader email first; fallback to team name or row[0]
    let teamName = ''
    if (leaderEmailIdx !== -1 && row[leaderEmailIdx]?.trim()) {
      teamName = row[leaderEmailIdx].trim().toLowerCase()
    } else if (teamNameIdx !== -1 && row[teamNameIdx]?.trim()) {
      teamName = row[teamNameIdx].trim()
    } else if (primaryIdx !== -1 && row[primaryIdx]?.trim()) {
      teamName = row[primaryIdx].trim()
    } else if (row.length > 0) {
      const emailCell = row.find((c) => typeof c === 'string' && c.includes('@') && c.includes('.'))
      teamName = emailCell ? emailCell.trim().toLowerCase() : (row[0] || '').trim()
    }

    let password = (
      passwordIdx !== -1 && row[passwordIdx] ? row[passwordIdx] : ''
    ).trim()
    const scoreVal =
      scoreIdx !== -1 && row[scoreIdx] ? parseInt(row[scoreIdx].trim(), 10) : 0
    const finalScore = Number.isSafeInteger(scoreVal) && scoreVal >= 0 ? scoreVal : 0

    if (!password) {
      password = 'HEIST2026'
    }

    if (!teamName) {
      errors.push({ row: rowNum, reason: 'Empty team leader email / identifier' })
      continue
    }

    if (teamName.length > 254) {
      errors.push({
        row: rowNum,
        team_name: teamName,
        reason: 'Team identifier exceeds 254 characters',
      })
      continue
    }

    const normalized = teamName.toLowerCase()
    if (seenInBatch.has(normalized)) {
      errors.push({
        row: rowNum,
        team_name: teamName,
        reason: 'Duplicate team leader email in uploaded CSV batch',
      })
      continue
    }
    seenInBatch.add(normalized)

    try {
      const existing = await db.query.teams.findFirst({
        where: eq(sql`lower(${teams.teamName})`, normalized),
      })

      if (existing) {
        errors.push({
          row: rowNum,
          team_name: teamName,
          reason: 'Team leader email already exists in database',
        })
        continue
      }

      const passwordHash = await hash(password, 10)
      const [newTeam] = await db
        .insert(teams)
        .values({
          teamName,
          passwordHash,
          score: finalScore,
        })
        .returning({
          id: teams.id,
          teamName: teams.teamName,
          score: teams.score,
        })

      created.push({
        id: newTeam.id,
        team_name: newTeam.teamName,
        score: newTeam.score,
      })
    } catch (err) {
      errors.push({
        row: rowNum,
        team_name: teamName,
        reason: err instanceof Error ? err.message : 'Database insertion error',
      })
    }
  }

  return c.json(
    {
      success: true,
      message: `Bulk team upload processed: ${created.length} squads registered directly into database${
        errors.length > 0 ? ` (${errors.length} skipped)` : ''
      }`,
      totalRows: dataRows.length,
      createdCount: created.length,
      skippedCount: errors.length,
      data: created,
      errors: errors.length > 0 ? errors : undefined,
    },
    created.length > 0 ? 201 : 200
  )
}

export async function updateTeam(c: AppContext) {
  const id = Number(c.req.param('id'))
  let body: { team_name?: unknown; password?: unknown; score?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400)
  }

  const updates: { teamName?: string; passwordHash?: string; score?: number } = {}

  if (body.team_name !== undefined) {
    if (
      typeof body.team_name !== 'string' ||
      !body.team_name.trim() ||
      body.team_name.trim().length > 100
    ) {
      return c.json({ success: false, message: 'team_name must be 1–100 characters' }, 400)
    }
    updates.teamName = body.team_name.trim()
  }

  if (body.password !== undefined) {
    if (
      typeof body.password !== 'string' ||
      body.password.trim().length < 4 ||
      new TextEncoder().encode(body.password).length > 72
    ) {
      return c.json(
        { success: false, message: 'password must be between 4 and 72 characters' },
        400
      )
    }
    updates.passwordHash = await hash(body.password.trim(), 10)
  }

  if (body.score !== undefined) {
    if (!Number.isSafeInteger(body.score) || (body.score as number) < 0) {
      return c.json({ success: false, message: 'score must be a non-negative integer' }, 400)
    }
    updates.score = body.score as number
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: 'Provide team_name, password, or score to update' }, 400)
  }

  try {
    const db = createDb(c.env.cec_heist_db)
    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning({
        id: teams.id,
        teamName: teams.teamName,
        score: teams.score,
      })

    if (!team) {
      return c.json({ success: false, message: 'Team not found' }, 404)
    }

    return c.json({
      success: true,
      data: { id: team.id, team_name: team.teamName, score: team.score },
    })
  } catch (error) {
    console.error('Update team failed:', error)
    return c.json({ success: false, message: 'Unable to update team' }, 500)
  }
}

export async function deleteTeam(c: AppContext) {
  const id = Number(c.req.param('id'))
  const db = createDb(c.env.cec_heist_db)

  try {
    const [team] = await db
      .delete(teams)
      .where(eq(teams.id, id))
      .returning({ id: teams.id })

    if (!team) {
      return c.json({ success: false, message: 'Team not found' }, 404)
    }

    return c.json({ success: true, message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Delete team failed:', error)
    return c.json({ success: false, message: 'Unable to delete team' }, 500)
  }
}
