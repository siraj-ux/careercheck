---
description: 
---

# Phase 1: Foundation, database and auth

Read docs/PRODUCT.md: Modules 2 and 11 and "Key Data Entities".
First show me an implementation plan.

1. Scaffold the project: structure, lint, typecheck, env handling,
   .env.example, README with run steps.
2. Design the SQLite schema from "Key Data Entities": users, student_profiles,
   test_sessions, questions, responses, results, career_matches, colleges,
   consultants, sessions (bookings), roadmaps, roadmap_milestones, notes,
   payments, messages. Add foreign keys, CHECK constraints, indexes and
   timestamps. Write migrations. STOP here and wait for my approval of the schema.
3. After approval: write a seed script with realistic sample data, including
   30+ sample questions across all test sections.
4. Phone + OTP auth: 6-digit code, resend timer, expiry, rate limits,
   wrong-number edit. Put the OTP provider behind an interface; the mock
   provider prints the code to the console in dev.
5. Sessions and server-side role guards for student, consultant, admin.
6. Layout shells: public, student (bottom tabs on mobile, top nav on desktop),
   consultant, admin. Shared UI kit with design tokens.
7. Add a backup script using the SQLite backup API, and document how to restore.
8. Tests for OTP rules and role guards.

Done when I can sign up with OTP, reach the right role's shell, and the
database seeds cleanly.