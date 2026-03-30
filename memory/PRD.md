# Leadway AI Readiness & Opportunity Scan - PRD

## Original Problem Statement
Build a clean, premium, mobile-friendly internal web app called "Leadway AI Readiness & Opportunity Scan" - a pre-training assessment for Leadway Group ahead of in-person AI training April 8-10, 2026.

## User Personas
1. **Participants**: Leadway employees completing the assessment
2. **Administrators**: Training coordinators viewing submissions and analytics

## Core Requirements
- Landing page with countdown timer to April 8-10, 2026
- Multi-step assessment form (8 sections)
- Email-based draft saving (autosave)
- Form validation
- Review page before submission
- Thank you confirmation page
- Admin dashboard with scoring, filters, charts, CSV export

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Simple password for admin

## What's Been Implemented (Jan 2026)
- [x] Landing page with countdown, logo, and premium design
- [x] Email dialog for draft tracking
- [x] 8-section multi-step assessment form
- [x] Form validation on all required fields
- [x] Autosave draft functionality (every 30 seconds)
- [x] Review page with all answers summarized
- [x] Submission with automatic scoring
- [x] Thank you page with next steps
- [x] Admin login with password protection
- [x] Admin dashboard with stats cards and charts
- [x] Submission filtering by subsidiary, department, readiness band
- [x] CSV export functionality
- [x] Scoring: AI Readiness, Opportunity Density, Governance Sensitivity
- [x] Readiness bands: Beginner, Explorer, Emerging Practitioner, Applied User, Champion Candidate

## Scoring Logic
- **AI Readiness Score (0-100)**: Based on familiarity, tools used, frequency, confidence, data understanding
- **Opportunity Density Score (0-100)**: Based on pain points, use cases, capstone idea quality
- **Governance Sensitivity Score (0-100)**: Based on concerns, privacy/compliance awareness, risk understanding

## Next Steps / Backlog
### P0 (Critical)
- None - MVP complete

### P1 (Important)
- Add email reminders for incomplete assessments
- Add submission deadline enforcement
- Bulk email notifications

### P2 (Nice to have)
- PDF export of individual submissions
- Comparison analytics across subsidiaries
- Real-time dashboard updates
- Pre-training material links based on readiness score
