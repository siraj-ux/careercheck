---
description: 
---

# Phase 4: Consultant, admin, hardening, launch

Read docs/PRODUCT.md: Modules 8, 9, 11 and section 8 (Gaps). First show me an
implementation plan.

1. Consultant dashboard: stat tiles, today's sessions, pending reviews,
   student table.
2. Student 360° three-pane view: summary and charts; engine recommendations
   with Accept / Edit / Override (saved on career_matches); notes with
   Private/Shared toggle; roadmap builder with Publish roadmap.
3. Booking: consultant availability, student booking, reschedule and cancel
   rules, provider-agnostic video link field. Basic consultant-student chat.
4. Admin console: funnel strip, assignment queue with suggested consultant and
   match % (language, city, level, specialisation), question bank with
   draft/live status, colleges and consultants management.
5. Notifications behind an interface (in-app bell now, email and WhatsApp
   pluggable): session reminders, roadmap published, payment result.
6. Cross-cutting: empty, error and offline states, accessibility pass.
7. Compliance: parental-consent step for under-18 users, privacy and terms
   pages, data export and delete request, audit log of consultant access to
   student data, security headers.
8. Launch: end-to-end tests of the full journey, demo mode, deployment notes
   (persistent volume for the SQLite file, backup schedule, env variables,
   Mumbai-region server).

Done when the whole journey works for all four roles, tests pass, and the
deployment checklist is complete.