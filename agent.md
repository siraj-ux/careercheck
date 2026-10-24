# CareerChecks

Mobile-first career-guidance web platform for Indian students (UG after Class 12,
PG graduating). Students take a psychometric and aptitude test, get a report,
then work with a human consultant who publishes a personalised roadmap.

Source of truth: docs/PRODUCT.md (screens, modules, data entities). Read the
relevant modules before coding. Items marked [Assumed] or [Gap] are undecided:
choose the simplest option and list it under "Assumptions" in your reply.

## Stack
- Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui
- SQLite via better-sqlite3 + Drizzle ORM, SQL migrations
- Zod for validation, Razorpay for payments
- Config only through environment variables, with .env.example kept current

## Roles
visitor, student, consultant, admin. Enforce access on the server, not only in the UI.

## Working rules
- Work in small steps. Run lint, typecheck and tests before saying a step is done.
- Show an implementation plan before coding each phase.
- Ask before adding dependencies or changing the data model after approval.
- Do not expand scope beyond the current phase.
- After each phase report: what was built, how to run it, how to test it,
  and open assumptions.