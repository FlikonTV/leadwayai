# Leadway AI Readiness & Opportunity Scan — PRD

## Original Problem Statement
Build a clean, premium, mobile-friendly internal web app called "Leadway AI Readiness & Opportunity Scan" for a pre-training assessment (now April 13-15, 2026). Corporate aesthetic (navy/deep blue base, subtle gold accents, white cards). Includes landing page, multi-step assessment form, admin dashboard, and post-training evaluation.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Hosting**: Emergent Platform (preview + deployment)

## Core Features

### 1. Landing Page (UPDATED - April 17, 2026)
- Certification group photo as hero background with dark overlay
- "Training Complete" green badge
- "Post-Training Evaluation" as primary gold CTA in hero
- "Pre-Training Assessment" disabled with "Closed" label
- Training Session Gallery (Day 1, 2, 3 Google Drive folder links)
- Alumni Network interest section
- Corporate navy/gold aesthetic

### 2. Pre-Training Assessment — 8 Sections (DONE)
- Participant Profile, AI Awareness, Pain Points, Use Cases, Governance, Collaboration, Capstone, Learning
- Autosave drafts via email, validation, review page
- Scoring: AI Readiness, Opportunity Density, Governance Sensitivity
- Readiness bands, insights, recommendations

### 3. Admin Dashboard (DONE)
- Password-protected (leadway2026)
- Overview stats, charts (Recharts)
- Full Report tab with executive summary
- Analysis tab with pain points, benefit areas, tools, learning expectations
- Submissions tab with filters, search, pagination
- Individual submission detail dialog
- CSV export

### 4. Post-Training Evaluation — 8 Sections (DONE - April 17, 2026)
- Route: /post-evaluation
- Hero headline: "How Far Have You Travelled?" (italic gold "Travelled")
- S1: Participant Profile
- S2: AI Readiness Now (5-level spectrum, multi-selects)
- S3: Tool Comfort Now (1-5 rating table, 10 tools)
- S4: What You Built & Deployed (prompts, agents, deployment status table)

### 6. PDF Report Export (DONE - April 17, 2026)
- GET /api/admin/report/pdf generates corporate-styled stakeholder PDF
- Includes: executive summary, overall scores with bar charts, readiness band distribution table, subsidiary breakdown, role level, AI usage frequency, top pain points, benefit areas, governance concerns, AI tools, learning expectations, capstone highlights, individual submission scores
- Corporate branding: Leadway + Cihan Digital Academy
- "PDF Report" button in admin dashboard header
- S5: Capability Shift (task comparison table, challenges, before/after)
- S6: 30-Day Commitment (daily tool, action plan table, obstacle plan)
- S7: Programme Evaluation (session ratings, 2 facilitator cards navy/teal, NPS 0-10, open feedback)
- S8: Goals Revisited (achieved checkboxes, follow-up interest, final words)
- Custom thank you: "The Testimony Is Forming." with quote block

### 7. Post-Eval Admin Dashboard Tab (DONE - April 17, 2026)
- New "Post-Eval" tab in admin dashboard with badge count
- GET /api/admin/post-eval-stats aggregates: NPS (avg, net, distribution), readiness distribution, session ratings, facilitator ratings, tool comfort averages, deployment summary, goals achieved, one-thing status
- Charts: NPS pie chart (promoters/passives/detractors), readiness bar chart
- Three-column layout: session ratings, Dr. Celestine card (navy), Orimolade card (teal)
- Tool comfort 2-column layout, goals achieved with progress bars, one-thing status
- Submissions table with readiness badges, NPS scores, detail dialog on click
- Detail dialog: profile, AI relationship, barriers removed, tool ratings, session ratings, NPS, goals, open feedback
- Backend: POST/GET /api/post-evaluations, POST/GET /api/post-eval-drafts

### 5. Thank You Pages (DONE)
- Pre-training: Assessment Complete with training info
- Post-training: "The Testimony Is Forming." with quote block and Cihan Digital Academy branding

## Database Collections
- `submissions` — Pre-training assessment submissions
- `drafts` — Pre-training assessment drafts
- `post_evaluations` — Post-training evaluation submissions
- `post_eval_drafts` — Post-training evaluation drafts

## Key Files
- `/app/backend/server.py` — All API endpoints
- `/app/frontend/src/pages/LandingPage.jsx` — Landing page
- `/app/frontend/src/pages/AssessmentForm.jsx` — Pre-training form
- `/app/frontend/src/pages/PostEvaluation.jsx` — Post-training form
- `/app/frontend/src/pages/PostEvalThankYou.jsx` — Post-eval thank you
- `/app/frontend/src/pages/AdminDashboard.jsx` — Admin panel
- `/app/frontend/src/App.js` — Routes

## Backlog
- P1: PDF export of individual submissions
- Cleanup: Remove /app/api/ folder (Vercel artifact)
