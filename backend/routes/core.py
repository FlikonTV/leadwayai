from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, timezone

from database import db, SUBSIDIARIES, COHORTS, ADMIN_PASSWORD
from models import Draft, DraftCreate, Submission, SubmissionCreate, AdminLogin
from scoring import (
    calculate_ai_readiness_score,
    calculate_opportunity_density_score,
    calculate_governance_sensitivity_score,
    get_readiness_band,
    generate_insights,
    generate_recommendations,
    identify_training_focus_areas,
)

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Leadway AI Readiness API"}


@router.get("/subsidiaries")
async def get_subsidiaries():
    return {"subsidiaries": SUBSIDIARIES}


@router.get("/cohorts")
async def get_cohorts():
    return {"cohorts": COHORTS}


@router.post("/admin/migrate-cohorts")
async def migrate_cohorts():
    result = await db.submissions.update_many(
        {"cohort": {"$exists": False}},
        {"$set": {"cohort": "cohort_1_lagos"}}
    )
    result2 = await db.drafts.update_many(
        {"cohort": {"$exists": False}},
        {"$set": {"cohort": "cohort_1_lagos"}}
    )
    return {"submissions_tagged": result.modified_count, "drafts_tagged": result2.modified_count}


@router.post("/admin/login")
async def admin_login(login: AdminLogin):
    if login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")


# ---- Drafts ----

@router.post("/drafts")
async def save_draft(draft_input: DraftCreate):
    existing = await db.drafts.find_one({"email": draft_input.email}, {"_id": 0})
    if existing:
        await db.drafts.update_one(
            {"email": draft_input.email},
            {"$set": {"data": draft_input.data, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Draft updated", "email": draft_input.email}
    else:
        draft = Draft(email=draft_input.email, data=draft_input.data)
        doc = draft.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.drafts.insert_one(doc)
        return {"message": "Draft saved", "id": draft.id, "email": draft_input.email}


@router.get("/drafts/{email}")
async def get_draft(email: str):
    draft = await db.drafts.find_one({"email": email}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found")
    return draft


# ---- Submissions ----

@router.post("/submissions", response_model=Submission)
async def create_submission(submission_input: SubmissionCreate):
    data = submission_input.model_dump()
    ai_readiness, ai_breakdown = calculate_ai_readiness_score(data)
    opportunity_density, opp_breakdown = calculate_opportunity_density_score(data)
    governance_sensitivity, gov_breakdown = calculate_governance_sensitivity_score(data)
    readiness_band = get_readiness_band(ai_readiness)
    insights = generate_insights(data, ai_readiness, opportunity_density, governance_sensitivity)
    recommendations = generate_recommendations(data, ai_readiness, opportunity_density, governance_sensitivity)
    training_focus = identify_training_focus_areas(data)

    submission = Submission(
        **data,
        ai_readiness_score=ai_readiness,
        ai_readiness_breakdown=ai_breakdown,
        opportunity_density_score=opportunity_density,
        opportunity_breakdown=opp_breakdown,
        governance_sensitivity_score=governance_sensitivity,
        governance_breakdown=gov_breakdown,
        readiness_band=readiness_band,
        insights=insights,
        recommendations=recommendations,
        training_focus_areas=training_focus
    )
    doc = submission.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    await db.submissions.insert_one(doc)
    await db.drafts.delete_one({"email": submission_input.email})
    return submission


@router.get("/submissions")
async def get_submissions(
    subsidiary: Optional[str] = None,
    department: Optional[str] = None,
    readiness_band: Optional[str] = None,
    cohort: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if subsidiary:
        query["subsidiary"] = subsidiary
    if department:
        query["department"] = department
    if readiness_band:
        query["readiness_band"] = readiness_band
    if cohort:
        query["cohort"] = cohort
    submissions = await db.submissions.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.submissions.count_documents(query)
    return {"submissions": submissions, "total": total}


@router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str):
    submission = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission
