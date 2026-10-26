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

## Phase 3: Results, Payments & Student Dashboard

- **Scoring & Report Generation**:
  - Multi-dimensional assessment calculating RIASEC Holland codes, Aptitude percentiles, Personality traits (OCEAN), and Work Values.
  - Server-gated report tiers: Free report gives summary RIASEC & top clusters; Paid report (₹999) unlocks top 5 career recommendations, college matches with cutoffs and fees, and personalized roadmap.
- **College Match Engine**:
  - Suggests realistic, reach, and safe colleges tailored to student's academic stream, target degree, entrance exams, and budget constraints.
- **Student Dashboard** (`/dashboard`):
  - Today-first overview with current stage progress tracker.
  - Meeting card with countdown, video call link, and session reschedule options.
  - 18-month Primary & Backup roadmap milestone viewer.
  - Quick action launcher for 1-on-1 booking, direct chat drawer, and notification bell.

---

## Phase 4: Consultant Workspace, Admin Console & DPDP Compliance

### 1. Consultant Workspace (`/consultant/dashboard`)
- **Today-First Dashboard**:
  - Real-time KPI strip: Today's sessions count, Active assigned students, Pending reviews due, and Average consultant rating.
  - Today's agenda with one-click Join Meeting button and inline Meeting URL editor (Google Meet, Zoom, MS Teams).
  - Reviews Due queue highlighting students with completed tests awaiting roadmap formulation.
  - Filterable Student Directory with search by name/RIASEC code, level filter (UG/PG), and session status filter.

### 2. Student 360 View (`/consultant/students/[studentId]`)
- **Strict 403 Security Isolation**: Consultants can only access students assigned to them. Unauthorized attempts return 403 and write an immutable audit log.
- **3-Pane Layout**:
  - **Left Pane (Profile & Intake)**: Student bio, academic stream, target year, budget band, relocation preference, and parental consent status.
  - **Center Pane (Assessment Results)**: RIASEC radar chart, Aptitude percentile bar chart, and personality breakdown with an accessible **"View as Table"** toggle for screen readers and keyboard navigation.
  - **Career Recommendations**: Interactive Accept / Edit / Override workflow. Consultants can accept AI recommendations or override them with custom job titles, match percentages, and guidance notes saved to `career_matches`.
  - **Private vs Shared Notes**: Counselor private notes remain hidden from student exports and student view. Shared notes are visible to the student.
  - **Roadmap Builder**: Dual Primary & Backup plan tabs. Add, remove, and reorder milestones (Exams, Applications, Prep, Documents, Decision) with target deadlines. One-click **Publish Roadmap** pushes milestones live to the student dashboard.

### 3. Booking & 1-on-1 Sessions
- **Weekly Slot Engine**: Automatically computes 45-minute booking slots across Tuesday, Thursday, Saturday, and Sunday for the upcoming 14 days, filtering out existing bookings.
- **24-Hour Reschedule Limit**: Students can reschedule once self-serve if $\ge 24\text{ hours}$ before session start. Rescheduling within 24 hours is rejected with an alert instructing the student to contact support.
- **Direct Chat Drawer**: Dedicated student-consultant messaging drawer active for 30 days post-session with auto-read receipt tracking and live polling.

### 4. Admin Console (`/admin`)
- **Funnel Strip**: Visual conversion metrics (Signups → Tests Completed → Paid Reports → Sessions Completed) with drop-off percentages.
- **Smart Consultant Assignment Queue**: Unassigned students are prioritized with a smart match algorithm that scores consultants based on academic stream match (UG/PG), current active student load, and maximum capacity.
- **Question Bank Management**: Real-time view of questions grouped by section with instant **Live / Draft** toggle to publish or quarantine questions without redeploying code.
- **Colleges & Consultants Directories**: Manage verified college listings and activate/deactivate consultant profiles.
- **Immutable Audit Trail**: Chronological log of all administrative actions, consultant assignments, and security events.

### 5. Compliance & Security (DPDP Act 2023)
- **Parental Consent**: Explicit parent/guardian phone verification and consent flag for minor students under 18 years old.
- **Public Legal Pages**: DPDP-compliant `/privacy` policy and clear `/terms` page detailing the 24-hour reschedule policy and 14-day refund policy.
- **Data Subject Rights**:
  - **Data Export** (`/api/profile/export`): Full JSON package of all student personal data, intake answers, test results, and shared notes (private counselor observations strictly excluded).
  - **Right to Erasure** (`/api/profile/delete`): Completely deletes or anonymizes personal identifiers, active sessions, and credentials while terminating active login sessions.
- **HTTP Security Headers**: Configured in `next.config.ts` including CSP, HSTS, X-Frame-Options (`DENY`), and Permissions-Policy.

---

## Demo Accounts & Test Credentials

The database comes pre-seeded with realistic test accounts for all 4 roles. In development mode (`OTP_MOCK_ENABLED=true`), use OTP `123456`:

| Role | Name | Phone Number | Description / Scenario |
|---|---|---|---|
| **Visitor** | Anonymous | N/A | Landing page exploration, sample preview, FAQ |
| **Student (Free)** | Aarav Sharma | `+919876543210` | Completed test, free summary report, paywall banner |
| **Student (Paid)** | Diya Patel | `+919876543211` | Paid ₹999, assigned to Dr. Priya Sharma, upcoming session |
| **Student (Unassigned)** | Sana Khan | `+919876543212` | Paid, waiting in Admin Assignment Queue |
| **Consultant** | Dr. Priya Sharma | `+919876543220` | Assigned to Diya Patel, active dashboard with sessions |
| **Consultant** | Rajesh Verma | `+919876543221` | Available for assignment, load capacity 3/15 |
| **Admin** | Admin User | `+919876543230` | Full access to `/admin` console, funnel, queue, audit |

---

## Database Backup & Disaster Recovery

CareerChecks utilizes SQLite with Write-Ahead Logging (`WAL`). Online atomic backups can be performed while the application is actively serving traffic.

### Create Backup
```bash
npm run db:backup
```
Creates an atomic, timestamped snapshot in `data/backups/careerchecks-backup-<timestamp>.sqlite`.

### Restore Backup
```bash
npm run db:restore data/backups/careerchecks-backup-<timestamp>.sqlite
```
Runs an integrity verification (`PRAGMA integrity_check`) on the snapshot, creates a pre-restore backup of the current database, and restores the specified snapshot with WAL mode pragmas.

---

## Production Deployment Guidance

1. **Persistent SQLite Volume**:
   - The SQLite database file (`DATABASE_URL`) must reside on a persistent volume mount (e.g. AWS EBS, Railway Volume, Fly.io persistent storage) — **never** inside the transient build container or ephemeral container filesystem.
2. **Automated Snapshot Cron**:
   - Configure a recurring cron job (e.g., hourly or daily) running `npm run db:backup` and streaming the snapshot artifact to an S3/GCS bucket with encryption at rest.
3. **Region Selection**:
   - Host the Next.js server in Mumbai (`ap-south-1` or `asia-south1`) to achieve sub-50ms latency for Indian students and consultants.
4. **Environment Variables**:
   - Set `NODE_ENV=production`, `OTP_MOCK_ENABLED=false`, a secure 64-character `SESSION_SECRET`, and live Razorpay / MSG91 credentials.

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
