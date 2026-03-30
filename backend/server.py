from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
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

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'leadway2026')

SUBSIDIARIES = [
    "Leadway Assurance", "Leadway Pensure", "Leadway Health",
    "Leadway Asset Management", "Leadway Trustees", "Shared Services", "Other"
]

# Models
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
    # Detailed Scores
    ai_readiness_score: float = 0.0
    ai_readiness_breakdown: Dict[str, float] = {}
    opportunity_density_score: float = 0.0
    opportunity_breakdown: Dict[str, float] = {}
    governance_sensitivity_score: float = 0.0
    governance_breakdown: Dict[str, float] = {}
    readiness_band: str = "Beginner"
    insights: List[str] = []
    recommendations: List[str] = []
    training_focus_areas: List[str] = []
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


# ==================== SCORING & ANALYSIS FUNCTIONS ====================

def calculate_ai_readiness_score(data: dict) -> tuple[float, Dict[str, float]]:
    """Calculate AI Readiness Score with detailed breakdown"""
    breakdown = {}
    
    # AI Familiarity (0-25 points)
    familiarity = data.get('ai_familiarity', 1)
    breakdown['familiarity'] = round((familiarity - 1) * 6.25, 1)
    
    # Tools Experience (0-20 points)
    tools = data.get('ai_tools_used', [])
    tools_score = min(len(tools) * 2.5, 20)
    breakdown['tools_experience'] = round(tools_score, 1)
    
    # Usage Frequency (0-20 points)
    freq_map = {"Never": 0, "Rarely": 5, "Monthly": 10, "Weekly": 15, "Daily": 20}
    breakdown['usage_frequency'] = freq_map.get(data.get('usage_frequency', 'Never'), 0)
    
    # Prompt Confidence (0-20 points)
    confidence = data.get('prompt_confidence', 1)
    breakdown['prompt_confidence'] = round((confidence - 1) * 5, 1)
    
    # Data Boundaries Understanding (0-15 points)
    boundaries = data.get('data_boundaries_understanding', 1)
    breakdown['data_understanding'] = round((boundaries - 1) * 3.75, 1)
    
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown


def calculate_opportunity_density_score(data: dict) -> tuple[float, Dict[str, float]]:
    """Calculate Opportunity Density Score with detailed breakdown"""
    breakdown = {}
    
    # Pain Points Identified (0-25 points)
    pain_points = data.get('workflow_pain_points', [])
    breakdown['pain_points_count'] = min(len(pain_points) * 5, 25)
    
    # Repetitive Tasks Detail (0-15 points)
    rep_tasks = data.get('repetitive_tasks', '')
    breakdown['repetitive_tasks_detail'] = min(len(rep_tasks) / 20, 15)
    
    # AI Benefit Areas (0-25 points)
    areas = data.get('areas_benefit_ai', [])
    breakdown['benefit_areas_count'] = min(len(areas) * 5, 25)
    
    # Capstone Problem Quality (0-20 points)
    capstone = data.get('capstone_problem', '')
    breakdown['capstone_quality'] = min(len(capstone) / 25, 20)
    
    # Success Definition Clarity (0-15 points)
    success = data.get('success_definition', '')
    breakdown['success_clarity'] = min(len(success) / 20, 15)
    
    # Round all values
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown


def calculate_governance_sensitivity_score(data: dict) -> tuple[float, Dict[str, float]]:
    """Calculate Governance Sensitivity Score with detailed breakdown"""
    breakdown = {}
    
    # Governance Concerns Awareness (0-30 points)
    concerns = data.get('governance_concerns', [])
    breakdown['concerns_awareness'] = min(len(concerns) * 6, 30)
    
    # Privacy Awareness (0-25 points)
    privacy = data.get('privacy_awareness', 1)
    breakdown['privacy_awareness'] = round((privacy - 1) * 6.25, 1)
    
    # Compliance Understanding (0-25 points)
    compliance = data.get('compliance_awareness', 1)
    breakdown['compliance_understanding'] = round((compliance - 1) * 6.25, 1)
    
    # Human Oversight Recognition (0-20 points)
    never_ai = data.get('never_fully_ai', '')
    breakdown['human_oversight'] = min(len(never_ai) / 15, 20)
    
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown


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


def generate_insights(data: dict, ai_score: float, opp_score: float, gov_score: float) -> List[str]:
    """Generate personalized insights based on assessment data"""
    insights = []
    
    # AI Readiness insights
    if ai_score < 30:
        insights.append("You're at the beginning of your AI journey - the training will provide foundational knowledge.")
    elif ai_score < 60:
        insights.append("You have some AI exposure and are ready to deepen your practical skills.")
    else:
        insights.append("Strong AI foundation - you can help peers and take on advanced use cases.")
    
    # Tool usage insights
    tools = data.get('ai_tools_used', [])
    if len(tools) == 0:
        insights.append("No AI tools used yet - training will introduce practical tool applications.")
    elif len(tools) >= 3:
        insights.append(f"Multi-tool experience ({len(tools)} tools) suggests adaptability to new AI solutions.")
    
    # Frequency insights
    freq = data.get('usage_frequency', 'Never')
    if freq == 'Daily':
        insights.append("Daily AI usage indicates strong integration potential in workflows.")
    elif freq == 'Never':
        insights.append("First-time AI exposure expected - focus on fundamentals and quick wins.")
    
    # Opportunity insights
    pain_points = data.get('workflow_pain_points', [])
    if len(pain_points) >= 4:
        insights.append(f"High opportunity density with {len(pain_points)} pain points identified for AI automation.")
    
    # Capstone insights
    capstone = data.get('capstone_problem', '')
    if len(capstone) > 200:
        insights.append("Well-articulated capstone problem shows clear vision for AI application.")
    
    # Governance insights
    if gov_score >= 60:
        insights.append("Strong governance awareness - suitable for responsible AI champion role.")
    elif gov_score < 30:
        insights.append("Governance awareness needs development - emphasize responsible AI in training.")
    
    return insights[:5]  # Return top 5 insights


def generate_recommendations(data: dict, ai_score: float, opp_score: float, gov_score: float) -> List[str]:
    """Generate personalized training recommendations"""
    recommendations = []
    
    band = get_readiness_band(ai_score)
    
    if band in ["Beginner", "Explorer"]:
        recommendations.append("Start with AI fundamentals module and basic prompt engineering exercises.")
        recommendations.append("Pair with an experienced AI user during hands-on sessions.")
    
    if band in ["Emerging Practitioner", "Applied User"]:
        recommendations.append("Focus on advanced prompt techniques and workflow integration.")
        recommendations.append("Lead a small group discussion on AI use cases in your function.")
    
    if band == "Champion Candidate":
        recommendations.append("Consider taking a mentorship role during the training.")
        recommendations.append("Explore advanced topics like AI strategy and change management.")
    
    # Based on pain points
    pain_points = data.get('workflow_pain_points', [])
    if "Report generation" in pain_points:
        recommendations.append("Prioritize learning AI-assisted report automation techniques.")
    if "Document processing" in pain_points:
        recommendations.append("Explore document AI and extraction capabilities in training.")
    if "Customer inquiries" in pain_points:
        recommendations.append("Focus on conversational AI and customer service automation.")
    
    # Based on learning preferences
    style = data.get('preferred_learning_style', '')
    if style == "Hands-on practice":
        recommendations.append("Engage actively in workshop exercises and build your own prompts.")
    elif style == "Case studies":
        recommendations.append("Pay special attention to industry case studies and real-world examples.")
    
    return recommendations[:5]


def identify_training_focus_areas(data: dict) -> List[str]:
    """Identify key training focus areas based on responses"""
    focus_areas = []
    
    # Based on learning expectations
    expectations = data.get('learning_expectations', [])
    if "Understanding AI fundamentals" in expectations:
        focus_areas.append("AI Fundamentals & Concepts")
    if "Hands-on prompt engineering" in expectations:
        focus_areas.append("Prompt Engineering Workshop")
    if "AI use case identification" in expectations:
        focus_areas.append("Use Case Discovery & Prioritization")
    if "Responsible AI practices" in expectations:
        focus_areas.append("AI Ethics & Governance")
    if "AI implementation strategies" in expectations:
        focus_areas.append("Implementation Planning")
    if "Change management for AI" in expectations:
        focus_areas.append("Change Management & Adoption")
    if "Measuring AI ROI" in expectations:
        focus_areas.append("AI Value Measurement")
    
    # Based on role level
    role = data.get('role_level', '')
    if role in ["Director", "Executive"]:
        focus_areas.append("AI Strategy & Leadership")
    elif role in ["Manager", "Senior Manager"]:
        focus_areas.append("Team AI Enablement")
    
    # Based on governance concerns
    concerns = data.get('governance_concerns', [])
    if len(concerns) >= 3:
        focus_areas.append("Risk & Compliance in AI")
    
    return list(set(focus_areas))[:6]


# ==================== API ROUTES ====================

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
        raise HTTPException(status_code=404, detail="No draft found")
    return draft

# Submission endpoints
@api_router.post("/submissions", response_model=Submission)
async def create_submission(submission_input: SubmissionCreate):
    data = submission_input.model_dump()
    
    # Calculate detailed scores
    ai_readiness, ai_breakdown = calculate_ai_readiness_score(data)
    opportunity_density, opp_breakdown = calculate_opportunity_density_score(data)
    governance_sensitivity, gov_breakdown = calculate_governance_sensitivity_score(data)
    readiness_band = get_readiness_band(ai_readiness)
    
    # Generate insights and recommendations
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
    subsidiary_pipeline = [{"$group": {"_id": "$subsidiary", "count": {"$sum": 1}}}]
    subsidiary_stats = await db.submissions.aggregate(subsidiary_pipeline).to_list(20)
    
    # Aggregate by readiness band
    band_pipeline = [{"$group": {"_id": "$readiness_band", "count": {"$sum": 1}}}]
    band_stats = await db.submissions.aggregate(band_pipeline).to_list(10)
    
    # Aggregate by department
    dept_pipeline = [{"$group": {"_id": "$department", "count": {"$sum": 1}}}]
    dept_stats = await db.submissions.aggregate(dept_pipeline).to_list(50)
    
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
    
    # Top pain points
    pain_pipeline = [
        {"$unwind": "$workflow_pain_points"},
        {"$group": {"_id": "$workflow_pain_points", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    pain_stats = await db.submissions.aggregate(pain_pipeline).to_list(10)
    
    # Top AI benefit areas
    benefit_pipeline = [
        {"$unwind": "$areas_benefit_ai"},
        {"$group": {"_id": "$areas_benefit_ai", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    benefit_stats = await db.submissions.aggregate(benefit_pipeline).to_list(10)
    
    # Top governance concerns
    concern_pipeline = [
        {"$unwind": "$governance_concerns"},
        {"$group": {"_id": "$governance_concerns", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    concern_stats = await db.submissions.aggregate(concern_pipeline).to_list(10)
    
    # Learning expectations
    learning_pipeline = [
        {"$unwind": "$learning_expectations"},
        {"$group": {"_id": "$learning_expectations", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    learning_stats = await db.submissions.aggregate(learning_pipeline).to_list(10)
    
    # AI tools usage
    tools_pipeline = [
        {"$unwind": "$ai_tools_used"},
        {"$group": {"_id": "$ai_tools_used", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    tools_stats = await db.submissions.aggregate(tools_pipeline).to_list(10)
    
    # Role level distribution
    role_pipeline = [{"$group": {"_id": "$role_level", "count": {"$sum": 1}}}]
    role_stats = await db.submissions.aggregate(role_pipeline).to_list(10)
    
    departments = await db.submissions.distinct("department")
    
    return {
        "total_submissions": total_submissions,
        "by_subsidiary": {item["_id"]: item["count"] for item in subsidiary_stats if item["_id"]},
        "by_readiness_band": {item["_id"]: item["count"] for item in band_stats if item["_id"]},
        "by_department": {item["_id"]: item["count"] for item in dept_stats if item["_id"]},
        "by_role_level": {item["_id"]: item["count"] for item in role_stats if item["_id"]},
        "average_scores": avg_stats[0] if avg_stats else {},
        "top_pain_points": [{"name": item["_id"], "count": item["count"]} for item in pain_stats],
        "top_benefit_areas": [{"name": item["_id"], "count": item["count"]} for item in benefit_stats],
        "top_governance_concerns": [{"name": item["_id"], "count": item["count"]} for item in concern_stats],
        "learning_expectations": [{"name": item["_id"], "count": item["count"]} for item in learning_stats],
        "ai_tools_usage": [{"name": item["_id"], "count": item["count"]} for item in tools_stats],
        "departments": departments
    }

@api_router.get("/admin/insights")
async def get_organization_insights():
    """Get organization-wide AI readiness insights"""
    total = await db.submissions.count_documents({})
    if total == 0:
        return {"message": "No submissions yet", "insights": []}
    
    # Get all submissions for analysis
    submissions = await db.submissions.find({}, {"_id": 0}).to_list(1000)
    
    insights = []
    
    # Calculate averages
    avg_ai = sum(s.get('ai_readiness_score', 0) for s in submissions) / total
    avg_opp = sum(s.get('opportunity_density_score', 0) for s in submissions) / total
    avg_gov = sum(s.get('governance_sensitivity_score', 0) for s in submissions) / total
    
    # Overall readiness insight
    if avg_ai < 40:
        insights.append({
            "category": "AI Readiness",
            "type": "warning",
            "title": "Foundation Building Needed",
            "description": f"Average AI readiness ({avg_ai:.1f}/100) suggests focus on fundamentals is crucial.",
            "recommendation": "Allocate more time to AI basics and hands-on tool introduction."
        })
    elif avg_ai >= 60:
        insights.append({
            "category": "AI Readiness",
            "type": "positive",
            "title": "Strong AI Foundation",
            "description": f"Average readiness of {avg_ai:.1f}/100 indicates good baseline knowledge.",
            "recommendation": "Can move quickly to advanced topics and real-world applications."
        })
    
    # Opportunity insight
    if avg_opp >= 50:
        insights.append({
            "category": "Opportunity",
            "type": "positive",
            "title": "High Opportunity Density",
            "description": f"Score of {avg_opp:.1f}/100 shows many automation opportunities identified.",
            "recommendation": "Prioritize quick-win use cases to demonstrate immediate value."
        })
    
    # Governance insight
    if avg_gov < 40:
        insights.append({
            "category": "Governance",
            "type": "warning",
            "title": "Governance Awareness Gap",
            "description": f"Average governance score ({avg_gov:.1f}/100) needs attention.",
            "recommendation": "Include dedicated responsible AI module in training agenda."
        })
    
    # Band distribution insight
    bands = {}
    for s in submissions:
        band = s.get('readiness_band', 'Unknown')
        bands[band] = bands.get(band, 0) + 1
    
    champions = bands.get('Champion Candidate', 0)
    beginners = bands.get('Beginner', 0)
    
    if champions > 0:
        insights.append({
            "category": "Talent",
            "type": "positive",
            "title": f"{champions} Champion Candidate(s) Identified",
            "description": "These individuals can serve as AI ambassadors post-training.",
            "recommendation": "Consider them for mentorship roles during workshops."
        })
    
    if beginners > total * 0.3:
        insights.append({
            "category": "Training Design",
            "type": "info",
            "title": "Significant Beginner Population",
            "description": f"{beginners} participants ({(beginners/total)*100:.0f}%) are beginners.",
            "recommendation": "Ensure foundational content is accessible and engaging."
        })
    
    # Cross-subsidiary collaboration potential
    subsidiaries = set(s.get('subsidiary') for s in submissions)
    if len(subsidiaries) >= 3:
        insights.append({
            "category": "Collaboration",
            "type": "positive",
            "title": "Cross-Subsidiary Representation",
            "description": f"{len(subsidiaries)} subsidiaries represented in submissions.",
            "recommendation": "Create mixed groups for collaborative exercises."
        })
    
    return {
        "total_analyzed": total,
        "average_scores": {
            "ai_readiness": round(avg_ai, 1),
            "opportunity_density": round(avg_opp, 1),
            "governance_sensitivity": round(avg_gov, 1)
        },
        "band_distribution": bands,
        "insights": insights
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
        "readiness_band", "insights", "recommendations", "training_focus_areas", "submitted_at"
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for sub in submissions:
        row = {}
        for field in fieldnames:
            value = sub.get(field, "")
            if isinstance(value, list):
                row[field] = "; ".join(str(v) for v in value)
            elif isinstance(value, dict):
                row[field] = str(value)
            else:
                row[field] = value
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leadway_ai_readiness_submissions.csv"}
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
