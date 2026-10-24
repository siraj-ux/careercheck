---
description: 
---

# Phase 3: Scoring, results, payments, student dashboard

Read docs/PRODUCT.md: Modules 6, 7, 10. First show me an implementation plan.

1. Scoring engine as pure, unit-tested functions: RIASEC code and radar scores,
   aptitude sub-scores (Logical, Verbal, Spatial), five neutral personality
   spectrums.
2. Career matching: ranked matches with fit % and plain-language reasons.
   College matching: Safe / Target / Reach from marks, budget, city and exams.
   Keep the rules in readable config files, not buried in code.
3. Results report: interest code, radar chart with table toggle, aptitude bars,
   personality spectrums, careers, colleges, "guidance, not a verdict"
   disclaimer. Desktop two-column layout with a sticky summary.
4. Free vs paid: free users see code, radar and aptitude. Everything below is
   blurred with an Unlock card. Enforce on the server.
5. Razorpay in test mode: order creation, signature verification, webhook,
   idempotent payment records, failure state ("you haven't been charged"),
   retry. Simple pricing page.
6. Student dashboard: greeting, next-step hero with deadline, upcoming session
   card, roadmap with Primary/Backup toggle, chat entry, saved colleges,
   empty states.
7. Share with parent: expiring read-only link. (Assumption: list it.)
8. Tests for scoring and payment verification.

Done when finishing a test gives a correct report, a test-mode payment unlocks
it, and the dashboard shows a published roadmap.