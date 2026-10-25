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

## Phase 2: Public Site & Test Engine

### Implemented Features
- **Marketing Landing Page** (`/`):
  - Responsive hero with dual CTAs (**Take the free test** & **Talk to a consultant**).
  - Configurable trust bar (5,000+ students, 80+ consultants, 4.8/5 rating).
  - 4-step "How it works" stepper (Take test → Get matched → Meet consultant → Follow roadmap).
  - Audience cards for Undergraduate (UG) and Postgraduate (PG) tracks.
  - Interactive sample report preview with a **"View as Table"** toggle.
  - Testimonials carousel, pricing comparison teaser, and 6-question FAQ accordion.
  - **"For Parents"** credibility strip highlighting verified credentials, transparent pricing, and zero kickbacks.
  - Complete SEO metadata, OpenGraph, and semantic HTML hierarchy.

- **5-Step Profile Intake** (`/onboarding/profile`):
  - Step 1: Level Selection (UG / PG) with "what you'll get" breakdown.
  - Step 2: Marks & Stream (UG board/stream/% or PG degree/specialisation).
  - Step 3: Aspirations & Preferred Cities (interest chips, city tags, relocate toggle).
  - Step 4: Budget & Knowledge (budget bands, fine-tune slider, loan toggle, rating 1-5).
  - Step 5: Review & Confirm with per-step edit links.
  - Real-time autosave with discreet `"Saved ✓"` feedback.
  - Desktop **"Why We Ask"** side panel providing transparency and reassurance.

- **Test Intro & Engine** (`/test/intro`, `/test/[sessionId]`, `/test/section-break`):
  - **Question Types**: Likert 1–5 scale (Interests, Personality, Values) and MCQ A–D (Aptitude & PG Domain).
  - **Timed Sections**: Aptitude (12 min) and PG Domain (10 min) run with server-enforced countdown timers. On expiry, sections are automatically submitted, unanswered questions count as skipped, and the test smoothly advances to the section break.
  - **Autosave & Resume**: Each answer is recorded in a fast transaction. Students can close the browser mid-test and resume at the exact question.
  - **Offline Queue**: Answers entered offline are cached locally and batched via `/api/test/sync` in a single transaction when reconnected.
  - **Desktop Keyboard Shortcuts**: Keys `1`–`5` for Likert ratings, `A`–`D` for multiple choice options, and `Enter ↵` for advancing.
  - **Section Break**: Celebration-first screens with overall test progress, next-section previews, and a pause option.
  - **Zero Key Leak Security**: Server strictly sanitizes question payloads; `correctKey` and internal scoring metrics are never sent to the client.

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
