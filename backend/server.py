from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import io
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Admin password (simple auth)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'leadway2026')

# Subsidiaries list
SUBSIDIARIES = [
    "Leadway Assurance",
    "Leadway Pensure",
    "Leadway Health",
    "Leadway Asset Management",
    "Leadway Trustees",
    "Shared Services",
    "Other"
]

# Define Models
class Draft(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    data: Dict[str, Any] = {}
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DraftCreate(BaseModel):
    email: str
    data: Dict[str, Any] = {}

class Submission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    job_title: str
    subsidiary: str
    department: str
    years_in_role: str
    role_level: str
    # AI Awareness
    ai_familiarity: int = 1
    ai_tools_used: List[str] = []
    usage_frequency: str = ""
    prompt_confidence: int = 1
    data_boundaries_understanding: int = 1
    # Pain Points
    workflow_pain_points: List[str] = []
    repetitive_tasks: str = ""
    time_consuming_tasks: str = ""
    # Function-Specific
    areas_benefit_ai: List[str] = []
    specific_use_cases: str = ""
    # Governance
    governance_concerns: List[str] = []
    privacy_awareness: int = 1
    compliance_awareness: int = 1
    never_fully_ai: str = ""
    # Cross-Subsidiary
    cross_subsidiary_opportunities: str = ""
    collaboration_areas: List[str] = []
    # Capstone
    capstone_problem: str = ""
    success_definition: str = ""
    capstone_impact: str = ""
    # Learning
    learning_expectations: List[str] = []
    preferred_learning_style: str = ""
    specific_topics: str = ""
    # Scores (calculated)
    ai_readiness_score: float = 0.0
    opportunity_density_score: float = 0.0
    governance_sensitivity_score: float = 0.0
    readiness_band: str = "Beginner"
    # Metadata
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubmissionCreate(BaseModel):
    email: str
    full_name: str
    job_title: str
    subsidiary: str
    department: str
    years_in_role: str
    role_level: str
    ai_familiarity: int = 1
    ai_tools_used: List[str] = []
    usage_frequency: str = ""
    prompt_confidence: int = 1
    data_boundaries_understanding: int = 1
    workflow_pain_points: List[str] = []
    repetitive_tasks: str = ""
    time_consuming_tasks: str = ""
    areas_benefit_ai: List[str] = []
    specific_use_cases: str = ""
    governance_concerns: List[str] = []
    privacy_awareness: int = 1
    compliance_awareness: int = 1
    never_fully_ai: str = ""
    cross_subsidiary_opportunities: str = ""
    collaboration_areas: List[str] = []
    capstone_problem: str = ""
    success_definition: str = ""
    capstone_impact: str = ""
    learning_expectations: List[str] = []
    preferred_learning_style: str = ""
    specific_topics: str = ""

class AdminLogin(BaseModel):
    password: str

# Scoring Functions
def calculate_ai_readiness_score(data: dict) -> float:
    """Calculate AI Readiness Score (0-100)"""
    score = 0
    # AI Familiarity (1-5) -> 0-25 points
    score += (data.get('ai_familiarity', 1) - 1) * 6.25
    # Tools used count -> 0-20 points (max 8 tools)
    tools_count = len(data.get('ai_tools_used', []))
    score += min(tools_count * 2.5, 20)
    # Usage frequency -> 0-20 points
    freq_map = {"Never": 0, "Rarely": 5, "Monthly": 10, "Weekly": 15, "Daily": 20}
    score += freq_map.get(data.get('usage_frequency', 'Never'), 0)
    # Prompt confidence (1-5) -> 0-20 points
    score += (data.get('prompt_confidence', 1) - 1) * 5
    # Data boundaries understanding (1-5) -> 0-15 points
    score += (data.get('data_boundaries_understanding', 1) - 1) * 3.75
    return min(round(score, 1), 100)

def calculate_opportunity_density_score(data: dict) -> float:
    """Calculate Opportunity Density Score (0-100)"""
    score = 0
    # Pain points count -> 0-25 points
    pain_count = len(data.get('workflow_pain_points', []))
    score += min(pain_count * 5, 25)
    # Repetitive tasks description length -> 0-15 points
    rep_tasks = data.get('repetitive_tasks', '')
    score += min(len(rep_tasks) / 20, 15)
    # Areas benefit AI count -> 0-25 points
    areas_count = len(data.get('areas_benefit_ai', []))
    score += min(areas_count * 5, 25)
    # Capstone problem quality (length) -> 0-20 points
    capstone = data.get('capstone_problem', '')
    score += min(len(capstone) / 25, 20)
    # Success definition quality -> 0-15 points
    success = data.get('success_definition', '')
    score += min(len(success) / 20, 15)
    return min(round(score, 1), 100)

def calculate_governance_sensitivity_score(data: dict) -> float:
    """Calculate Governance Sensitivity Score (0-100)"""
    score = 0
    # Governance concerns count -> 0-30 points
    concerns_count = len(data.get('governance_concerns', []))
    score += min(concerns_count * 6, 30)
    # Privacy awareness (1-5) -> 0-25 points
    score += (data.get('privacy_awareness', 1) - 1) * 6.25
    # Compliance awareness (1-5) -> 0-25 points
    score += (data.get('compliance_awareness', 1) - 1) * 6.25
    # Never fully AI response quality -> 0-20 points
    never_ai = data.get('never_fully_ai', '')
    score += min(len(never_ai) / 15, 20)
    return min(round(score, 1), 100)

def get_readiness_band(score: float) -> str:
    """Get readiness band based on AI Readiness Score"""
    if score < 20:
        return "Beginner"
    elif score < 40:
        return "Explorer"
    elif score < 60:
        return "Emerging Practitioner"
    elif score < 80:
        return "Applied User"
    else:
        return "Champion Candidate"

# Routes
@api_router.get("/")
async def root():
    return {"message": "Leadway AI Readiness API"}

@api_router.get("/subsidiaries")
async def get_subsidiaries():
    return {"subsidiaries": SUBSIDIARIES}

# Draft endpoints
@api_router.post("/drafts")
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

@api_router.get("/drafts/{email}")
async def get_draft(email: str):
    draft = await db.drafts.find_one({"email": email}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found for this email")
    return draft

# Submission endpoints
@api_router.post("/submissions", response_model=Submission)
async def create_submission(submission_input: SubmissionCreate):
    data = submission_input.model_dump()
    
    # Calculate scores
    ai_readiness = calculate_ai_readiness_score(data)
    opportunity_density = calculate_opportunity_density_score(data)
    governance_sensitivity = calculate_governance_sensitivity_score(data)
    readiness_band = get_readiness_band(ai_readiness)
    
    submission = Submission(
        **data,
        ai_readiness_score=ai_readiness,
        opportunity_density_score=opportunity_density,
        governance_sensitivity_score=governance_sensitivity,
        readiness_band=readiness_band
    )
    
    doc = submission.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.submissions.insert_one(doc)
    
    # Delete draft after successful submission
    await db.drafts.delete_one({"email": submission_input.email})
    
    return submission

@api_router.get("/submissions")
async def get_submissions(
    subsidiary: Optional[str] = None,
    department: Optional[str] = None,
    readiness_band: Optional[str] = None,
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
    
    submissions = await db.submissions.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.submissions.count_documents(query)
    
    return {"submissions": submissions, "total": total}

@api_router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str):
    submission = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

# Admin endpoints
@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    if login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.get("/admin/stats")
async def get_admin_stats():
    total_submissions = await db.submissions.count_documents({})
    
    # Aggregate by subsidiary
    subsidiary_pipeline = [
        {"$group": {"_id": "$subsidiary", "count": {"$sum": 1}}}
    ]
    subsidiary_stats = await db.submissions.aggregate(subsidiary_pipeline).to_list(20)
    
    # Aggregate by readiness band
    band_pipeline = [
        {"$group": {"_id": "$readiness_band", "count": {"$sum": 1}}}
    ]
    band_stats = await db.submissions.aggregate(band_pipeline).to_list(10)
    
    # Average scores
    avg_pipeline = [
        {"$group": {
            "_id": None,
            "avg_ai_readiness": {"$avg": "$ai_readiness_score"},
            "avg_opportunity_density": {"$avg": "$opportunity_density_score"},
            "avg_governance_sensitivity": {"$avg": "$governance_sensitivity_score"}
        }}
    ]
    avg_stats = await db.submissions.aggregate(avg_pipeline).to_list(1)
    
    # Get unique departments
    departments = await db.submissions.distinct("department")
    
    return {
        "total_submissions": total_submissions,
        "by_subsidiary": {item["_id"]: item["count"] for item in subsidiary_stats if item["_id"]},
        "by_readiness_band": {item["_id"]: item["count"] for item in band_stats if item["_id"]},
        "average_scores": avg_stats[0] if avg_stats else {},
        "departments": departments
    }

@api_router.get("/admin/export")
async def export_csv():
    submissions = await db.submissions.find({}, {"_id": 0}).to_list(10000)
    
    if not submissions:
        raise HTTPException(status_code=404, detail="No submissions to export")
    
    output = io.StringIO()
    
    fieldnames = [
        "id", "email", "full_name", "job_title", "subsidiary", "department",
        "years_in_role", "role_level", "ai_familiarity", "ai_tools_used",
        "usage_frequency", "prompt_confidence", "data_boundaries_understanding",
        "workflow_pain_points", "repetitive_tasks", "time_consuming_tasks",
        "areas_benefit_ai", "specific_use_cases", "governance_concerns",
        "privacy_awareness", "compliance_awareness", "never_fully_ai",
        "cross_subsidiary_opportunities", "collaboration_areas",
        "capstone_problem", "success_definition", "capstone_impact",
        "learning_expectations", "preferred_learning_style", "specific_topics",
        "ai_readiness_score", "opportunity_density_score", "governance_sensitivity_score",
        "readiness_band", "submitted_at"
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for sub in submissions:
        row = {}
        for field in fieldnames:
            value = sub.get(field, "")
            if isinstance(value, list):
                row[field] = "; ".join(value)
            else:
                row[field] = value
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leadway_submissions.csv"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
