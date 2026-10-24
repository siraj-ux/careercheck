---
description: 
---

# Phase 2: Public site and test engine

Read docs/PRODUCT.md: Modules 1, 3, 4, 5. First show me an implementation plan.

1. Landing page: hero with both CTAs, trust bar, How it works stepper, UG/PG
   cards, sample report, testimonials, pricing teaser, FAQ, parents strip.
   Responsive, with SEO metadata.
2. Level selection and 5-step profile intake with autosave, back/next,
   progress bar, review step, and a "Why we ask" panel on desktop.
3. Test intro and engine:
   - Question types: Likert 1-5 and A-D multiple choice (text or image stem).
   - Sections: Interests, Aptitude (timed), Personality, Values.
     PG adds a domain-knowledge section.
   - Autosave one row per answer in a short transaction. Resume from the last
     question. Offline answer queue that syncs in one batched transaction.
   - Timed sections: the timer runs server-side. On expiry, auto-submit the
     section and move on. (Assumption: list it.)
   - Save and exit, section-break screens with progress.
   - Desktop keyboard shortcuts (1-5, A-D, Enter).
4. Validate every answer on the server. Never send correct keys to the client.
5. Tests for timer expiry, resume and autosave.

Done when a new user can go from landing to a completed test on mobile and
desktop, close the browser mid-test, and resume.