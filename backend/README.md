# CEC HEIST Backend

Backend API for CEC HEIST, built with Hono, TypeScript, Cloudflare Workers, Cloudflare D1, and Drizzle ORM.

## Setup

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Check Drizzle migration consistency:

```bash
npx drizzle-kit check
```

Generate Cloudflare Worker types:

```bash
npm run cf-typegen
```

## Authentication

- Login uses email and password only.
- Public signup and OAuth are not supported.
- Passwords are stored as bcrypt hashes, never as plaintext.
- JWTs are signed using the `JWT_SECRET` environment secret.
- Supported roles are `user` and `admin`.
- Both roles can view the leaderboard and team details.
- Only admins can create, update, or delete team data.
- Only admins can create challenges.

Configure `JWT_SECRET` locally in `.dev.vars`. Use a strong, randomly generated secret of at least 32 characters. Never commit `.dev.vars` or share the secret.

## User Provisioning

User accounts must be provisioned by an authorized operator. There is no public signup endpoint.

1. Obtain the approved user email addresses and assign each account the appropriate role.
2. Generate a unique, cryptographically secure temporary password for each account.
3. Hash each password with bcrypt before storing it in the `users.password_hash` column.
4. Deliver temporary passwords privately to their intended users; never log or commit plaintext passwords.
5. Do not place real user credentials or production accounts in test seed files.

A production provisioning procedure must be reviewed and approved before use. Never run account-seeding commands against production without verifying the target database and authorization.

## Challenges

Admins can create challenges with a title, description, flag, optional HTTP/HTTPS hint URL, level (1–4), and difficulty (`easy`, `medium`, or `high`).

**Challenge flags are secrets.** Never include them in public API responses, logs, screenshots, or committed test data.

## Database Migrations

Drizzle migration files are stored in `drizzle/`.

Review migrations before applying them. Use the local D1 database for development and testing. Do not apply migrations to remote or production D1 without team approval and confirmation of the deployed database's migration history.

## Test Data

`seed.sql` contains **test team data only**. It is not real competition data and must not be treated as production data.

Keep test accounts, test passwords, and test challenge flags out of production databases and committed seed files.

## Deployment

```bash
npm run deploy
```

Deploy only after the team has approved the required environment secrets, database migrations, and production configuration.
