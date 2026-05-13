# Leadway AI Readiness & Opportunity Scan — PRD

## Original Problem Statement
Build a clean, premium, mobile-friendly internal web app called "Leadway AI Readiness & Opportunity Scan" for a pre-training assessment (now April 13-15, 2026). Corporate aesthetic (navy/deep blue base, subtle gold accents, white cards). Includes landing page, multi-step assessment form, admin dashboard, and post-training evaluation. Multi-cohort support for Cohort 1 (Lagos) and Cohort 2 (Abuja).

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Hosting**: Emergent Platform (preview + deployment)

### Backend Structure (Refactored May 13, 2026)
```
/app/backend/
  server.py          (31 lines)  — App setup, middleware, router includes
  database.py        (23 lines)  — MongoDB connection, constants (COHORTS, SUBSIDIARIES)
  models.py          (112 lines) — All Pydantic models
  scoring.py         (148 lines) — Scoring, insights, recommendations
  routes/
    core.py          (143 lines) — Root, cohorts, drafts, submissions, admin login
    admin.py         (860 lines) — Admin stats, insights, report, CSV/PDF export
    post_eval.py     (829 lines) — Post-eval CRUD, stats, CSV/PDF export
```

## Core Features

### 1. Landing Page (UPDATED - May 13, 2026)
- Cohort selector tabs: Cohort 1 — Lagos | Cohort 2 — Abuja
- Certification group photo as hero background with dark overlay
- Cohort 1 (completed): "Training Complete" green badge, post-eval CTA, gallery, alumni section
- Cohort 2 (upcoming): countdown timer, pre-assessment CTA, location/dates/format info cards
- Stores selected cohort in localStorage before navigation to forms

### 2. Pre-Training Assessment — 8 Sections (DONE)
- Participant Profile, AI Awareness, Pain Points, Use Cases, Governance, Collaboration, Capstone, Learning
- Autosave drafts via email, validation, review page
- Scoring: AI Readiness, Opportunity Density, Governance Sensitivity
- Readiness bands, insights, recommendations
- Includes cohort field in submissions and drafts

### 3. Admin Dashboard (UPDATED - May 13, 2026)
- Password-protected (leadway2026)
- **Cohort filter dropdown** in header: All Cohorts / Cohort 1 — Lagos / Cohort 2 — Abuja
- All tabs (Overview, Full Report, Analysis, Submissions, Post-Eval) react to cohort filter
- All exports (CSV, PDF) filter by selected cohort
- Overview stats, charts (Recharts)
- Full Report tab with executive summary
- Analysis tab with pain points, benefit areas, tools, learning expectations
- Submissions tab with filters, search, pagination
- Individual submission detail dialog

### 4. Post-Training Evaluation — 8 Sections (DONE)
- Route: /post-evaluation
- Hero headline: "How Far Have You Travelled?" (italic gold "Travelled")
- S1: Participant Profile
- S2: AI Readiness Now (5-level spectrum, multi-selects)
- S3: Tool Comfort Now (1-5 rating table, 10 tools)
- S4: What You Built & Deployed (prompts, agents, deployment status table)
- S5: Capability Shift (task comparison table, challenges, before/after)
- S6: 30-Day Commitment (daily tool, action plan table, obstacle plan)
- S7: Programme Evaluation (session ratings, 2 facilitator cards navy/teal, NPS 0-10, open feedback)
- S8: Goals Revisited (achieved checkboxes, follow-up interest, final words)
- Includes cohort field in submissions and drafts
- Custom thank you: "The Testimony Is Forming." with quote block

### 5. Thank You Pages (DONE)
- Pre-training: Assessment Complete with training info
- Post-training: "The Testimony Is Forming." with quote block and Cihan Digital Academy branding

### 6. PDF Report Export (DONE)
- GET /api/admin/report/pdf generates corporate-styled stakeholder PDF (supports ?cohort= filter)
- Includes: executive summary, overall scores, readiness band distribution, subsidiary breakdown, capstone highlights
- Corporate branding: Leadway + Cihan Digital Academy

### 7. Post-Eval Admin Dashboard Tab (DONE)
- "Post-Eval" tab with badge count, respects cohort filter
- Programme Grade Card, NPS Classification, Charts
- Session ratings, facilitator cards, tool comfort, agents built
- Deployment Status Matrix, Capability Shift, 30-Day Commitments
- Feedback Highlights, Before & After Reflections
- Consulting PDF Report and CSV Export (both support cohort filtering)

### 8. Multi-Cohort Support (DONE - May 13, 2026)
- Backend: All endpoints accept `?cohort=` query parameter for filtering
- Frontend: LandingPage cohort selector stores value in localStorage
- AssessmentForm and PostEvaluation read cohort from localStorage and include in payloads
- AdminDashboard has cohort filter dropdown that drives all data fetching
- Cohorts: cohort_1_lagos (Lagos, April 13-15, completed), cohort_2_abuja (Abuja, May 15-18, upcoming)

## Database Collections
- `submissions` — Pre-training assessment submissions (includes cohort field)
- `drafts` — Pre-training assessment drafts
- `post_evaluations` — Post-training evaluation submissions (includes cohort field)
- `post_eval_drafts` — Post-training evaluation drafts (includes cohort field)

## Key Files

### 9. Cohort Comparison Tab (DONE - May 13, 2026)
- New "Compare" tab in Admin Dashboard with BarChart3 icon
- Side-by-side Programme Grade cards (gold for C1, teal for C2)
- Key Metrics table: Pre-Training Submissions, Post-Training Evaluations, Avg AI Readiness, Avg Opportunity Density, Avg Governance Sensitivity, NPS Average, NPS Net Score — with Delta column
- Readiness Band Distribution grouped bar chart (C1 vs C2)
- Participation by Subsidiary grouped horizontal bar chart
- NPS Comparison with stacked progress bars (Promoters/Passives/Detractors)
- Empty state when no data available

- `/app/backend/server.py` — All API endpoints
- `/app/frontend/src/pages/LandingPage.jsx` — Landing page with cohort selector
- `/app/frontend/src/pages/AssessmentForm.jsx` — Pre-training form (reads cohort from localStorage)
- `/app/frontend/src/pages/PostEvaluation.jsx` — Post-training form (reads cohort from localStorage)
- `/app/frontend/src/pages/PostEvalThankYou.jsx` — Post-eval thank you
- `/app/frontend/src/pages/AdminDashboard.jsx` — Admin panel with cohort filter
- `/app/frontend/src/App.js` — Routes

## Backlog
- P1: PDF export of individual submissions