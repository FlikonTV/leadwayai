# Leadway AI Readiness & Opportunity Scan - PRD

## Original Problem Statement
Build a clean, premium, mobile-friendly internal web app called "Leadway AI Readiness & Opportunity Scan" - a pre-training assessment for Leadway Group ahead of in-person AI training April 8-10, 2026.

## User Personas
1. **Participants**: Leadway employees completing the assessment
2. **Administrators**: Training coordinators viewing submissions, analytics, and insights

## Core Requirements
- Landing page with countdown timer to April 8-10, 2026
- Multi-step assessment form (8 sections)
- Email-based draft saving (autosave)
- Form validation and review page
- Detailed scoring with insights and recommendations
- Admin dashboard with comprehensive analytics

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Simple password for admin

## What's Been Implemented (Jan 2026)

### Frontend
- [x] Compact, interactive landing page with countdown timer
- [x] Section navigation pills in assessment form
- [x] 8-section multi-step form with validation
- [x] Autosave draft functionality (30-second intervals)
- [x] Review page before submission
- [x] Thank you page with next steps
- [x] Admin dashboard with 4 tabs (Overview, Insights, Analysis, Submissions)
- [x] Detailed submission modal with score breakdowns

### Backend Analysis Engine
- [x] AI Readiness Score (0-100) with 5-factor breakdown:
  - Familiarity, Tools Experience, Usage Frequency, Prompt Confidence, Data Understanding
- [x] Opportunity Density Score (0-100) with 5-factor breakdown:
  - Pain Points Count, Repetitive Tasks Detail, Benefit Areas, Capstone Quality, Success Clarity
- [x] Governance Sensitivity Score (0-100) with 4-factor breakdown:
  - Concerns Awareness, Privacy Awareness, Compliance Understanding, Human Oversight
- [x] Readiness Bands: Beginner, Explorer, Emerging Practitioner, Applied User, Champion Candidate
- [x] Personalized Insights generation (up to 5 per submission)
- [x] Training Recommendations generation (up to 5 per submission)
- [x] Training Focus Areas identification
- [x] Organization-wide Insights API

### Admin Analytics
- [x] Real-time stats (total submissions, average scores)
- [x] Subsidiary distribution chart
- [x] Readiness band pie chart
- [x] Top Pain Points aggregation
- [x] Top AI Benefit Areas aggregation
- [x] AI Tools Usage statistics
- [x] Learning Expectations breakdown
- [x] CSV export with all data including insights

## Scoring Logic Details

### AI Readiness (100 points max)
- Familiarity (1-5): 0-25 points
- Tools Used: 2.5 pts each, max 20 points
- Frequency: Never=0, Rarely=5, Monthly=10, Weekly=15, Daily=20
- Prompt Confidence (1-5): 0-20 points
- Data Understanding (1-5): 0-15 points

### Opportunity Density (100 points max)
- Pain Points: 5 pts each, max 25 points
- Repetitive Tasks Description: up to 15 points
- Benefit Areas: 5 pts each, max 25 points
- Capstone Problem Quality: up to 20 points
- Success Definition Clarity: up to 15 points

### Governance Sensitivity (100 points max)
- Concerns: 6 pts each, max 30 points
- Privacy Awareness (1-5): 0-25 points
- Compliance Awareness (1-5): 0-25 points
- Human Oversight Recognition: up to 20 points

## Admin Access
- URL: `/admin`
- Password: `leadway2026`

## Next Steps / Backlog
### P1 (Important)
- Email notifications for submission confirmations
- Submission deadline enforcement
- PDF export of individual submissions

### P2 (Nice to have)
- Comparison analytics across subsidiaries
- Real-time dashboard updates via WebSocket
- Pre-training material recommendations based on readiness score
- Bulk analysis reports for training facilitators
