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
from fpdf import FPDF

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

@api_router.get("/admin/report")
async def get_comprehensive_report():
    """Generate a comprehensive organization-wide AI readiness report"""
    total = await db.submissions.count_documents({})
    if total == 0:
        return {"message": "No submissions yet", "report": None}
    
    submissions = await db.submissions.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate overall statistics
    avg_ai = sum(s.get('ai_readiness_score', 0) for s in submissions) / total
    avg_opp = sum(s.get('opportunity_density_score', 0) for s in submissions) / total
    avg_gov = sum(s.get('governance_sensitivity_score', 0) for s in submissions) / total
    
    # Band distribution
    bands = {}
    for s in submissions:
        band = s.get('readiness_band', 'Unknown')
        bands[band] = bands.get(band, 0) + 1
    
    # Subsidiary breakdown with average scores
    subsidiary_stats = {}
    for s in submissions:
        sub = s.get('subsidiary', 'Unknown')
        if sub not in subsidiary_stats:
            subsidiary_stats[sub] = {'count': 0, 'ai_total': 0, 'opp_total': 0, 'gov_total': 0}
        subsidiary_stats[sub]['count'] += 1
        subsidiary_stats[sub]['ai_total'] += s.get('ai_readiness_score', 0)
        subsidiary_stats[sub]['opp_total'] += s.get('opportunity_density_score', 0)
        subsidiary_stats[sub]['gov_total'] += s.get('governance_sensitivity_score', 0)
    
    for sub in subsidiary_stats:
        count = subsidiary_stats[sub]['count']
        subsidiary_stats[sub]['avg_ai'] = round(subsidiary_stats[sub]['ai_total'] / count, 1)
        subsidiary_stats[sub]['avg_opp'] = round(subsidiary_stats[sub]['opp_total'] / count, 1)
        subsidiary_stats[sub]['avg_gov'] = round(subsidiary_stats[sub]['gov_total'] / count, 1)
    
    # Role level distribution
    role_stats = {}
    for s in submissions:
        role = s.get('role_level', 'Unknown')
        if role not in role_stats:
            role_stats[role] = {'count': 0, 'avg_ai': 0}
        role_stats[role]['count'] += 1
        role_stats[role]['avg_ai'] += s.get('ai_readiness_score', 0)
    for role in role_stats:
        role_stats[role]['avg_ai'] = round(role_stats[role]['avg_ai'] / role_stats[role]['count'], 1)
    
    # Aggregate pain points with frequency
    pain_points = {}
    for s in submissions:
        for pp in s.get('workflow_pain_points', []):
            pain_points[pp] = pain_points.get(pp, 0) + 1
    top_pain_points = sorted(pain_points.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Aggregate benefit areas
    benefit_areas = {}
    for s in submissions:
        for ba in s.get('areas_benefit_ai', []):
            benefit_areas[ba] = benefit_areas.get(ba, 0) + 1
    top_benefit_areas = sorted(benefit_areas.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Aggregate governance concerns
    gov_concerns = {}
    for s in submissions:
        for gc in s.get('governance_concerns', []):
            gov_concerns[gc] = gov_concerns.get(gc, 0) + 1
    top_gov_concerns = sorted(gov_concerns.items(), key=lambda x: x[1], reverse=True)[:8]
    
    # Learning expectations
    learning_exp = {}
    for s in submissions:
        for le in s.get('learning_expectations', []):
            learning_exp[le] = learning_exp.get(le, 0) + 1
    top_learning = sorted(learning_exp.items(), key=lambda x: x[1], reverse=True)
    
    # AI tools usage
    tools_usage = {}
    for s in submissions:
        for tool in s.get('ai_tools_used', []):
            tools_usage[tool] = tools_usage.get(tool, 0) + 1
    top_tools = sorted(tools_usage.items(), key=lambda x: x[1], reverse=True)
    
    # Usage frequency distribution
    freq_dist = {}
    for s in submissions:
        freq = s.get('usage_frequency', 'Unknown')
        freq_dist[freq] = freq_dist.get(freq, 0) + 1
    
    # Capstone themes analysis (extract key themes from capstone problems)
    capstone_themes = []
    for s in submissions:
        capstone = s.get('capstone_problem', '')
        if capstone:
            capstone_themes.append({
                'name': s.get('full_name', 'Unknown'),
                'subsidiary': s.get('subsidiary', ''),
                'department': s.get('department', ''),
                'problem': capstone[:200] + ('...' if len(capstone) > 200 else ''),
                'impact': s.get('capstone_impact', '')[:150]
            })
    
    # Generate executive summary
    exec_summary = []
    
    # Overall readiness assessment
    if avg_ai >= 60:
        exec_summary.append({
            "type": "positive",
            "title": "Strong AI Foundation",
            "detail": f"The organization shows a solid AI readiness baseline with an average score of {avg_ai:.1f}/100. The team is well-positioned for intermediate to advanced training content."
        })
    elif avg_ai >= 40:
        exec_summary.append({
            "type": "neutral",
            "title": "Moderate AI Readiness",
            "detail": f"Average AI readiness of {avg_ai:.1f}/100 indicates mixed experience levels. Training should balance foundational concepts with practical applications."
        })
    else:
        exec_summary.append({
            "type": "warning",
            "title": "Foundation Building Required",
            "detail": f"Average AI readiness of {avg_ai:.1f}/100 suggests most participants need fundamental AI education before advanced topics."
        })
    
    # Opportunity assessment
    if avg_opp >= 50:
        exec_summary.append({
            "type": "positive",
            "title": "High Opportunity Density",
            "detail": f"Strong opportunity density score ({avg_opp:.1f}/100) indicates participants have identified numerous automation opportunities. Focus on prioritization and quick wins."
        })
    
    # Governance assessment
    if avg_gov >= 60:
        exec_summary.append({
            "type": "positive",
            "title": "Strong Governance Awareness",
            "detail": f"High governance sensitivity ({avg_gov:.1f}/100) shows mature understanding of AI risks. Organization is ready for responsible AI adoption."
        })
    elif avg_gov < 40:
        exec_summary.append({
            "type": "warning",
            "title": "Governance Training Needed",
            "detail": f"Governance sensitivity of {avg_gov:.1f}/100 indicates need for dedicated responsible AI and risk management content."
        })
    
    # Champion identification
    champions = bands.get('Champion Candidate', 0)
    applied = bands.get('Applied User', 0)
    if champions > 0 or applied > 0:
        exec_summary.append({
            "type": "positive",
            "title": f"{champions + applied} Advanced AI Users Identified",
            "detail": f"{champions} Champion Candidates and {applied} Applied Users can serve as peer mentors and AI ambassadors post-training."
        })
    
    # Generate training recommendations
    training_recs = []
    
    # Based on band distribution
    beginners = bands.get('Beginner', 0) + bands.get('Explorer', 0)
    if beginners > total * 0.5:
        training_recs.append({
            "priority": "High",
            "area": "AI Fundamentals",
            "recommendation": "Allocate significant time to AI basics, terminology, and foundational concepts.",
            "rationale": f"{beginners} participants ({(beginners/total)*100:.0f}%) are at beginner/explorer level."
        })
    
    # Based on top pain points
    if top_pain_points:
        top_pp = top_pain_points[0][0]
        training_recs.append({
            "priority": "High",
            "area": "Practical Application",
            "recommendation": f"Include hands-on exercises addressing '{top_pp}' - the most common pain point.",
            "rationale": f"Reported by {top_pain_points[0][1]} participants ({(top_pain_points[0][1]/total)*100:.0f}%)."
        })
    
    # Based on learning expectations
    if top_learning:
        training_recs.append({
            "priority": "Medium",
            "area": "Curriculum Focus",
            "recommendation": f"Prioritize '{top_learning[0][0]}' in the training agenda.",
            "rationale": f"Top learning expectation, selected by {top_learning[0][1]} participants."
        })
    
    # Based on governance
    if avg_gov < 50:
        training_recs.append({
            "priority": "High",
            "area": "Responsible AI",
            "recommendation": "Include dedicated module on AI ethics, data privacy, and governance frameworks.",
            "rationale": f"Average governance awareness ({avg_gov:.1f}/100) needs strengthening."
        })
    
    # Cross-subsidiary recommendation
    if len(subsidiary_stats) >= 3:
        training_recs.append({
            "priority": "Medium",
            "area": "Collaboration",
            "recommendation": "Create mixed subsidiary groups for collaborative exercises to foster cross-organizational learning.",
            "rationale": f"{len(subsidiary_stats)} subsidiaries represented - opportunity for knowledge sharing."
        })
    
    return {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "total_submissions": total,
        "executive_summary": exec_summary,
        "overall_scores": {
            "ai_readiness": round(avg_ai, 1),
            "opportunity_density": round(avg_opp, 1),
            "governance_sensitivity": round(avg_gov, 1)
        },
        "readiness_distribution": bands,
        "subsidiary_breakdown": subsidiary_stats,
        "role_level_breakdown": role_stats,
        "usage_frequency_distribution": freq_dist,
        "top_pain_points": [{"name": pp[0], "count": pp[1], "percentage": round(pp[1]/total*100, 1)} for pp in top_pain_points],
        "top_benefit_areas": [{"name": ba[0], "count": ba[1], "percentage": round(ba[1]/total*100, 1)} for ba in top_benefit_areas],
        "top_governance_concerns": [{"name": gc[0], "count": gc[1], "percentage": round(gc[1]/total*100, 1)} for gc in top_gov_concerns],
        "learning_expectations": [{"name": le[0], "count": le[1], "percentage": round(le[1]/total*100, 1)} for le in top_learning],
        "ai_tools_adoption": [{"name": t[0], "count": t[1], "percentage": round(t[1]/total*100, 1)} for t in top_tools],
        "capstone_projects": capstone_themes,
        "training_recommendations": training_recs
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


class ReportPDF(FPDF):
    """Custom PDF class for Leadway AI Readiness Report"""
    NAVY = (13, 33, 55)
    GOLD = (184, 134, 11)
    TEAL = (0, 109, 119)
    WHITE = (255, 255, 255)
    LIGHT_GRAY = (245, 245, 245)
    GRAY = (120, 120, 120)
    DARK = (30, 30, 30)

    def header(self):
        self.set_fill_color(*self.NAVY)
        self.rect(0, 0, 210, 18, 'F')
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(*self.WHITE)
        self.set_y(5)
        self.cell(0, 8, 'Leadway Group  |  AI Readiness & Opportunity Scan', align='C')
        self.ln(14)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.GRAY)
        self.cell(0, 10, f'(c) Cihan Digital Academy  |  Page {self.page_no()}/{{nb}}', align='C')

    def section_title(self, title):
        self.ln(4)
        self.set_fill_color(*self.NAVY)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 11)
        self.cell(0, 8, f'  {title}', fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def sub_title(self, title):
        self.set_text_color(*self.NAVY)
        self.set_font('Helvetica', 'B', 9)
        self.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_text_color(*self.DARK)
        self.set_font('Helvetica', '', 9)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def gold_label(self, label, value):
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.GRAY)
        self.cell(55, 5, label)
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*self.NAVY)
        self.cell(0, 5, str(value), new_x="LMARGIN", new_y="NEXT")

    def score_bar(self, label, score, max_val=100):
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.DARK)
        self.cell(58, 6, label)
        x = self.get_x()
        y = self.get_y()
        bar_w = 90
        # Background bar
        self.set_fill_color(*self.LIGHT_GRAY)
        self.rect(x, y + 1, bar_w, 4, 'F')
        # Fill bar
        fill_w = (score / max_val) * bar_w if max_val > 0 else 0
        self.set_fill_color(*self.GOLD)
        self.rect(x, y + 1, fill_w, 4, 'F')
        self.set_x(x + bar_w + 3)
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*self.NAVY)
        self.cell(0, 6, f'{score}%', new_x="LMARGIN", new_y="NEXT")

    def add_table(self, headers, rows, col_widths=None):
        if not col_widths:
            col_widths = [190 / len(headers)] * len(headers)
        # Header row
        self.set_fill_color(*self.NAVY)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 7.5)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 6, h, border=1, fill=True)
        self.ln()
        # Data rows
        self.set_text_color(*self.DARK)
        self.set_font('Helvetica', '', 7.5)
        for ri, row in enumerate(rows):
            fill = ri % 2 == 0
            if fill:
                self.set_fill_color(*self.LIGHT_GRAY)
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 5.5, str(cell)[:50], border=1, fill=fill)
            self.ln()
        self.ln(2)

    def ranked_list(self, items, key_name="name", val_key="percentage", max_items=10):
        for i, item in enumerate(items[:max_items]):
            name = str(item.get(key_name, ''))[:60]
            pct = item.get(val_key, 0)
            count = item.get('count', '')
            self.set_font('Helvetica', '', 8)
            self.set_text_color(*self.DARK)
            self.cell(5, 5, f'{i+1}.')
            self.cell(100, 5, name)
            x = self.get_x()
            y = self.get_y()
            bar_w = 50
            self.set_fill_color(*self.LIGHT_GRAY)
            self.rect(x, y + 1, bar_w, 3, 'F')
            self.set_fill_color(*self.TEAL)
            self.rect(x, y + 1, (pct / 100) * bar_w, 3, 'F')
            self.set_x(x + bar_w + 2)
            self.set_font('Helvetica', 'B', 7)
            self.set_text_color(*self.NAVY)
            self.cell(0, 5, f'{pct}% ({count})', new_x="LMARGIN", new_y="NEXT")


@api_router.get("/admin/report/pdf")
async def export_report_pdf():
    """Generate a comprehensive PDF report for stakeholders"""
    total = await db.submissions.count_documents({})
    if total == 0:
        raise HTTPException(status_code=404, detail="No submissions to generate report")

    submissions = await db.submissions.find({}, {"_id": 0}).to_list(1000)

    # Compute all stats (same as /admin/report)
    avg_ai = round(sum(s.get('ai_readiness_score', 0) for s in submissions) / total, 1)
    avg_opp = round(sum(s.get('opportunity_density_score', 0) for s in submissions) / total, 1)
    avg_gov = round(sum(s.get('governance_sensitivity_score', 0) for s in submissions) / total, 1)

    bands = {}
    for s in submissions:
        band = s.get('readiness_band', 'Unknown')
        bands[band] = bands.get(band, 0) + 1

    subsidiary_stats = {}
    for s in submissions:
        sub = s.get('subsidiary', 'Unknown')
        if sub not in subsidiary_stats:
            subsidiary_stats[sub] = {'count': 0, 'ai_total': 0, 'opp_total': 0, 'gov_total': 0}
        subsidiary_stats[sub]['count'] += 1
        subsidiary_stats[sub]['ai_total'] += s.get('ai_readiness_score', 0)
        subsidiary_stats[sub]['opp_total'] += s.get('opportunity_density_score', 0)
        subsidiary_stats[sub]['gov_total'] += s.get('governance_sensitivity_score', 0)
    for sub in subsidiary_stats:
        c = subsidiary_stats[sub]['count']
        subsidiary_stats[sub]['avg_ai'] = round(subsidiary_stats[sub]['ai_total'] / c, 1)
        subsidiary_stats[sub]['avg_opp'] = round(subsidiary_stats[sub]['opp_total'] / c, 1)
        subsidiary_stats[sub]['avg_gov'] = round(subsidiary_stats[sub]['gov_total'] / c, 1)

    role_stats = {}
    for s in submissions:
        rl = s.get('role_level', 'Unknown')
        role_stats[rl] = role_stats.get(rl, 0) + 1

    freq_dist = {}
    for s in submissions:
        f = s.get('usage_frequency', 'Unknown')
        freq_dist[f] = freq_dist.get(f, 0) + 1

    # Top lists
    from collections import Counter
    pain_counter = Counter()
    benefit_counter = Counter()
    gov_counter = Counter()
    learn_counter = Counter()
    tool_counter = Counter()
    for s in submissions:
        for pp in s.get('workflow_pain_points', []):
            pain_counter[pp] += 1
        for ba in s.get('areas_benefit_ai', []):
            benefit_counter[ba] += 1
        for gc in s.get('governance_concerns', []):
            gov_counter[gc] += 1
        for le in s.get('learning_expectations', []):
            learn_counter[le] += 1
        for t in s.get('ai_tools_used', []):
            tool_counter[t] += 1

    def to_ranked(counter, n=10):
        return [{"name": k, "count": v, "percentage": round(v / total * 100, 1)} for k, v in counter.most_common(n)]

    top_pain = to_ranked(pain_counter)
    top_benefit = to_ranked(benefit_counter)
    top_gov = to_ranked(gov_counter)
    top_learn = to_ranked(learn_counter)
    top_tools = to_ranked(tool_counter)

    capstone_themes = []
    for s in submissions:
        if s.get('capstone_problem'):
            capstone_themes.append({
                "name": s.get('full_name', 'Anonymous'),
                "subsidiary": s.get('subsidiary', ''),
                "problem": s.get('capstone_problem', ''),
                "impact": s.get('capstone_impact', '')
            })

    # ---- BUILD PDF ----
    pdf = ReportPDF('P', 'mm', 'A4')
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # Title page content
    pdf.ln(5)
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(*ReportPDF.NAVY)
    pdf.cell(0, 10, 'AI Readiness & Opportunity Scan', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(*ReportPDF.GRAY)
    pdf.cell(0, 7, 'Comprehensive Organisation Report', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 9)
    pdf.cell(0, 5, f'Leadway Group  |  AI-Powered Enterprise Excellence Programme  |  April 13-15, 2026', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, f'Generated: {datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")}  |  Total Respondents: {total}', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    # Divider
    pdf.set_draw_color(*ReportPDF.GOLD)
    pdf.set_line_width(0.5)
    pdf.line(30, pdf.get_y(), 180, pdf.get_y())
    pdf.ln(5)

    # Executive Summary
    pdf.section_title('EXECUTIVE SUMMARY')
    overall_band = max(bands, key=bands.get) if bands else "N/A"
    exec_text = (
        f"A total of {total} participants across {len(subsidiary_stats)} subsidiaries completed the "
        f"AI Readiness & Opportunity Scan. The organisation's average AI Readiness Score is {avg_ai}%, "
        f"Opportunity Density is {avg_opp}%, and Governance Sensitivity stands at {avg_gov}%. "
        f"The most common readiness band is \"{overall_band}\" "
        f"({bands.get(overall_band, 0)} participants, {round(bands.get(overall_band, 0) / total * 100)}%)."
    )
    pdf.body_text(exec_text)

    # Overall Scores
    pdf.section_title('OVERALL SCORES')
    pdf.score_bar('AI Readiness', avg_ai)
    pdf.score_bar('Opportunity Density', avg_opp)
    pdf.score_bar('Governance Sensitivity', avg_gov)
    pdf.ln(2)

    # Readiness Distribution
    pdf.section_title('READINESS BAND DISTRIBUTION')
    band_order = ["AI Novice", "Emerging Practitioner", "Developing Strategist", "AI Ready", "AI Champion"]
    band_headers = ["Readiness Band", "Count", "Percentage"]
    band_rows = []
    for b in band_order:
        if b in bands:
            band_rows.append([b, str(bands[b]), f"{round(bands[b] / total * 100, 1)}%"])
    for b in bands:
        if b not in band_order:
            band_rows.append([b, str(bands[b]), f"{round(bands[b] / total * 100, 1)}%"])
    pdf.add_table(band_headers, band_rows, [85, 30, 75])

    # Subsidiary Breakdown
    pdf.section_title('SUBSIDIARY BREAKDOWN')
    sub_headers = ["Subsidiary", "N", "AI Readiness", "Opportunity", "Governance"]
    sub_rows = []
    for sub, st in sorted(subsidiary_stats.items()):
        sub_rows.append([sub[:30], str(st['count']), f"{st['avg_ai']}%", f"{st['avg_opp']}%", f"{st['avg_gov']}%"])
    pdf.add_table(sub_headers, sub_rows, [60, 15, 38, 38, 39])

    # Role Level Breakdown
    pdf.section_title('ROLE LEVEL BREAKDOWN')
    role_headers = ["Role Level", "Count", "Percentage"]
    role_rows = [[r, str(c), f"{round(c / total * 100, 1)}%"] for r, c in sorted(role_stats.items(), key=lambda x: -x[1])]
    pdf.add_table(role_headers, role_rows, [85, 30, 75])

    # AI Usage Frequency
    pdf.section_title('AI USAGE FREQUENCY')
    freq_headers = ["Frequency", "Count", "Percentage"]
    freq_rows = [[f, str(c), f"{round(c / total * 100, 1)}%"] for f, c in sorted(freq_dist.items(), key=lambda x: -x[1])]
    pdf.add_table(freq_headers, freq_rows, [85, 30, 75])

    # Top Pain Points
    if top_pain:
        pdf.section_title('TOP WORKFLOW PAIN POINTS')
        pdf.ranked_list(top_pain)
        pdf.ln(1)

    # Top Benefit Areas
    if top_benefit:
        pdf.section_title('TOP AREAS FOR AI BENEFIT')
        pdf.ranked_list(top_benefit)
        pdf.ln(1)

    # Governance Concerns
    if top_gov:
        pdf.section_title('GOVERNANCE CONCERNS')
        pdf.ranked_list(top_gov)
        pdf.ln(1)

    # AI Tools Adoption
    if top_tools:
        pdf.section_title('AI TOOLS CURRENTLY USED')
        pdf.ranked_list(top_tools)
        pdf.ln(1)

    # Learning Expectations
    if top_learn:
        pdf.section_title('LEARNING EXPECTATIONS')
        pdf.ranked_list(top_learn)
        pdf.ln(1)

    # Capstone Projects
    if capstone_themes:
        pdf.section_title('CAPSTONE PROJECT HIGHLIGHTS')
        cap_headers = ["Participant", "Subsidiary", "Problem", "Expected Impact"]
        cap_rows = [[c['name'][:20], c['subsidiary'][:15], c['problem'][:40], c['impact'][:35]] for c in capstone_themes[:15]]
        pdf.add_table(cap_headers, cap_rows, [35, 30, 65, 60])

    # Individual Submissions Summary
    pdf.section_title('INDIVIDUAL SUBMISSION SCORES')
    ind_headers = ["Name", "Subsidiary", "Role", "AI %", "Opp %", "Gov %", "Band"]
    ind_rows = []
    for s in sorted(submissions, key=lambda x: x.get('ai_readiness_score', 0), reverse=True):
        ind_rows.append([
            s.get('full_name', '')[:20],
            s.get('subsidiary', '')[:18],
            s.get('role_level', '')[:12],
            f"{s.get('ai_readiness_score', 0)}",
            f"{s.get('opportunity_density_score', 0)}",
            f"{s.get('governance_sensitivity_score', 0)}",
            s.get('readiness_band', '')[:20]
        ])
    pdf.add_table(ind_headers, ind_rows, [30, 30, 22, 18, 18, 18, 54])

    # Final page — disclaimer
    pdf.ln(5)
    pdf.set_draw_color(*ReportPDF.GOLD)
    pdf.set_line_width(0.3)
    pdf.line(30, pdf.get_y(), 180, pdf.get_y())
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.set_text_color(*ReportPDF.GRAY)
    pdf.multi_cell(0, 4,
        'This report was generated by the Leadway AI Readiness & Opportunity Scan platform. '
        'Data is based on self-reported participant responses and should be interpreted alongside '
        'qualitative assessment. Prepared by Cihan Digital Academy for Leadway Group.'
    )

    # Output
    pdf_bytes = pdf.output()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Leadway_AI_Readiness_Report.pdf"}
    )

# ==================== POST-EVALUATION ENDPOINTS ====================

class PostEvalDraftCreate(BaseModel):
    email: str
    data: Dict[str, Any] = {}

class PostEvalSubmissionCreate(BaseModel):
    email: str
    data: Dict[str, Any] = {}

@api_router.post("/post-eval-drafts")
async def save_post_eval_draft(draft_input: PostEvalDraftCreate):
    existing = await db.post_eval_drafts.find_one({"email": draft_input.email}, {"_id": 0})
    if existing:
        await db.post_eval_drafts.update_one(
            {"email": draft_input.email},
            {"$set": {"data": draft_input.data, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Draft updated", "email": draft_input.email}
    else:
        doc = {
            "id": str(uuid.uuid4()),
            "email": draft_input.email,
            "data": draft_input.data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.post_eval_drafts.insert_one(doc)
        return {"message": "Draft saved", "id": doc["id"], "email": draft_input.email}

@api_router.get("/post-eval-drafts/{email}")
async def get_post_eval_draft(email: str):
    draft = await db.post_eval_drafts.find_one({"email": email}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found")
    return draft

@api_router.post("/post-evaluations")
async def create_post_evaluation(submission: PostEvalSubmissionCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "email": submission.email,
        "data": submission.data,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.post_evaluations.insert_one(doc)
    await db.post_eval_drafts.delete_one({"email": submission.email})
    doc.pop("_id", None)
    return doc

@api_router.get("/post-evaluations")
async def get_post_evaluations(skip: int = 0, limit: int = 100):
    evaluations = await db.post_evaluations.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.post_evaluations.count_documents({})
    return {"evaluations": evaluations, "total": total}

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
