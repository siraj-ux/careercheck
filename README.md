# CareerChecks

Mobile-first career-guidance web platform for Indian students (UG after Class 12, PG graduating). Students take a psychometric and aptitude test, get a comprehensive report, and work with a human consultant who reviews results and publishes a personalised roadmap.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom design tokens (Indigo primary, Orange unlock/upsell, Red error)
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) and [Drizzle ORM](https://orm.drizzle.team)
- **Validation**: [Zod](https://zod.dev) on all environment and input boundaries
- **Testing**: [Vitest](https://vitest.dev)

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ (Node v22 or v26 recommended)
- npm 10+

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default variables:
```env
NODE_ENV=development
DATABASE_URL=./data/careerchecks.sqlite
SESSION_SECRET=careerchecks_dev_secret_key_32_characters_minimum
OTP_MOCK_ENABLED=true
APP_URL=http://localhost:3000
```

### 3. Database Migrations
Run the Drizzle migration runner to initialize the SQLite schema:
```bash
npm run db:migrate
```

To regenerate migrations after changing schema in `src/server/db/schema/`:
```bash
npm run db:generate
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server with hot reload |
| `npm run build` | Builds production application |
| `npm run start` | Starts production server |
| `npm run lint` | Runs ESLint across all files |
| `npm run typecheck` | Validates TypeScript types across the project |
| `npm run test` | Runs the Vitest test suite |
| `npm run db:generate` | Generates new SQL migration files using Drizzle Kit |
| `npm run db:migrate` | Applies pending SQL migrations to the SQLite database |
| `npm run db:seed` | Seeds database with realistic sample questions, users, and roles |
| `npm run db:backup` | Takes an atomic SQLite backup snapshot to `data/backups/` |
| `npm run db:restore` | Restores database from a specified backup snapshot |

---

## Database Rules & Pragmas

Every connection automatically runs:
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```
- Primary keys are strict UUIDs/ULIDs.
- Timestamps are UTC ISO-8601 strings.
- Booleans are stored as `0` or `1`.
- JSON payloads are validated with Zod before storage.
- The SQLite file resides on a persistent volume at `DATABASE_URL`.
