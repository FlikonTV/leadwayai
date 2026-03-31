from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import io
import csv
import os

# Create FastAPI app
app = FastAPI()

# MongoDB connection - use environment variable
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb+srv://user:pass@cluster.mongodb.net/')
DB_NAME = os.environ.get('DB_NAME', 'leadway_ai_readiness')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'leadway2026')

client = None
db = None

def get_db():
    global client, db
    if client is None:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
    return db

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# Scoring Functions
def calculate_ai_readiness_score(data: dict) -> tuple:
    breakdown = {}
    breakdown['familiarity'] = round((data.get('ai_familiarity', 1) - 1) * 6.25, 1)
    tools = data.get('ai_tools_used', [])
    breakdown['tools_experience'] = round(min(len(tools) * 2.5, 20), 1)
    freq_map = {"Never": 0, "Rarely": 5, "Monthly": 10, "Weekly": 15, "Daily": 20}
    breakdown['usage_frequency'] = freq_map.get(data.get('usage_frequency', 'Never'), 0)
    breakdown['prompt_confidence'] = round((data.get('prompt_confidence', 1) - 1) * 5, 1)
    breakdown['data_understanding'] = round((data.get('data_boundaries_understanding', 1) - 1) * 3.75, 1)
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown

def calculate_opportunity_density_score(data: dict) -> tuple:
    breakdown = {}
    breakdown['pain_points_count'] = min(len(data.get('workflow_pain_points', [])) * 5, 25)
    breakdown['repetitive_tasks_detail'] = min(len(data.get('repetitive_tasks', '')) / 20, 15)
    breakdown['benefit_areas_count'] = min(len(data.get('areas_benefit_ai', [])) * 5, 25)
    breakdown['capstone_quality'] = min(len(data.get('capstone_problem', '')) / 25, 20)
    breakdown['success_clarity'] = min(len(data.get('success_definition', '')) / 20, 15)
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown

def calculate_governance_sensitivity_score(data: dict) -> tuple:
    breakdown = {}
    breakdown['concerns_awareness'] = min(len(data.get('governance_concerns', [])) * 6, 30)
    breakdown['privacy_awareness'] = round((data.get('privacy_awareness', 1) - 1) * 6.25, 1)
    breakdown['compliance_understanding'] = round((data.get('compliance_awareness', 1) - 1) * 6.25, 1)
    breakdown['human_oversight'] = min(len(data.get('never_fully_ai', '')) / 15, 20)
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown

def get_readiness_band(score: float) -> str:
    if score < 20: return "Beginner"
    elif score < 40: return "Explorer"
    elif score < 60: return "Emerging Practitioner"
    elif score < 80: return "Applied User"
    else: return "Champion Candidate"

def generate_insights(data: dict, ai_score: float, opp_score: float, gov_score: float) -> List[str]:
    insights = []
    if ai_score < 30:
        insights.append("You're at the beginning of your AI journey - the training will provide foundational knowledge.")
    elif ai_score < 60:
        insights.append("You have some AI exposure and are ready to deepen your practical skills.")
    else:
        insights.append("Strong AI foundation - you can help peers and take on advanced use cases.")
    
    tools = data.get('ai_tools_used', [])
    if len(tools) == 0:
        insights.append("No AI tools used yet - training will introduce practical tool applications.")
    elif len(tools) >= 3:
        insights.append(f"Multi-tool experience ({len(tools)} tools) suggests adaptability to new AI solutions.")
    
    freq = data.get('usage_frequency', 'Never')
    if freq == 'Daily':
        insights.append("Daily AI usage indicates strong integration potential in workflows.")
    
    pain_points = data.get('workflow_pain_points', [])
    if len(pain_points) >= 4:
        insights.append(f"High opportunity density with {len(pain_points)} pain points identified for AI automation.")
    
    if gov_score >= 60:
        insights.append("Strong governance awareness - suitable for responsible AI champion role.")
    elif gov_score < 30:
        insights.append("Governance awareness needs development - emphasize responsible AI in training.")
    
    return insights[:5]

def generate_recommendations(data: dict, ai_score: float, opp_score: float, gov_score: float) -> List[str]:
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
    
    pain_points = data.get('workflow_pain_points', [])
    if "Report generation" in pain_points:
        recommendations.append("Prioritize learning AI-assisted report automation techniques.")
    if "Document processing" in pain_points:
        recommendations.append("Explore document AI and extraction capabilities in training.")
    
    style = data.get('preferred_learning_style', '')
    if style == "Hands-on practice":
        recommendations.append("Engage actively in workshop exercises and build your own prompts.")
    elif style == "Case studies":
        recommendations.append("Pay special attention to industry case studies and real-world examples.")
    
    return recommendations[:5]

def identify_training_focus_areas(data: dict) -> List[str]:
    focus_areas = []
    expectations = data.get('learning_expectations', [])
    mapping = {
        "Understanding AI fundamentals": "AI Fundamentals & Concepts",
        "Hands-on prompt engineering": "Prompt Engineering Workshop",
        "AI use case identification": "Use Case Discovery & Prioritization",
        "Responsible AI practices": "AI Ethics & Governance",
        "AI implementation strategies": "Implementation Planning",
        "Change management for AI": "Change Management & Adoption",
        "Measuring AI ROI": "AI Value Measurement"
    }
    for exp in expectations:
        if exp in mapping:
            focus_areas.append(mapping[exp])
    
    role = data.get('role_level', '')
    if role in ["Director", "Executive"]:
        focus_areas.append("AI Strategy & Leadership")
    elif role in ["Manager", "Senior Manager"]:
        focus_areas.append("Team AI Enablement")
    
    if len(data.get('governance_concerns', [])) >= 3:
        focus_areas.append("Risk & Compliance in AI")
    
    return list(set(focus_areas))[:6]


# Routes
@app.get("/api")
async def root():
    return {"message": "Leadway AI Readiness API"}

@app.get("/api/subsidiaries")
async def get_subsidiaries():
    return {"subsidiaries": SUBSIDIARIES}

@app.post("/api/drafts")
async def save_draft(draft_input: DraftCreate):
    database = get_db()
    existing = await database.drafts.find_one({"email": draft_input.email}, {"_id": 0})
    if existing:
        await database.drafts.update_one(
            {"email": draft_input.email},
            {"$set": {"data": draft_input.data, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Draft updated", "email": draft_input.email}
    else:
        draft = Draft(email=draft_input.email, data=draft_input.data)
        doc = draft.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await database.drafts.insert_one(doc)
        return {"message": "Draft saved", "id": draft.id, "email": draft_input.email}

@app.get("/api/drafts/{email}")
async def get_draft(email: str):
    database = get_db()
    draft = await database.drafts.find_one({"email": email}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found")
    return draft

@app.post("/api/submissions")
async def create_submission(submission_input: SubmissionCreate):
    database = get_db()
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
    
    await database.submissions.insert_one(doc)
    await database.drafts.delete_one({"email": submission_input.email})
    
    return submission

@app.get("/api/submissions")
async def get_submissions(
    subsidiary: Optional[str] = None,
    department: Optional[str] = None,
    readiness_band: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    database = get_db()
    query = {}
    if subsidiary:
        query["subsidiary"] = subsidiary
    if department:
        query["department"] = department
    if readiness_band:
        query["readiness_band"] = readiness_band
    
    submissions = await database.submissions.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await database.submissions.count_documents(query)
    
    return {"submissions": submissions, "total": total}

@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: str):
    database = get_db()
    submission = await database.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

@app.post("/api/admin/login")
async def admin_login(login: AdminLogin):
    if login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/admin/stats")
async def get_admin_stats():
    database = get_db()
    total_submissions = await database.submissions.count_documents({})
    
    subsidiary_pipeline = [{"$group": {"_id": "$subsidiary", "count": {"$sum": 1}}}]
    subsidiary_stats = await database.submissions.aggregate(subsidiary_pipeline).to_list(20)
    
    band_pipeline = [{"$group": {"_id": "$readiness_band", "count": {"$sum": 1}}}]
    band_stats = await database.submissions.aggregate(band_pipeline).to_list(10)
    
    avg_pipeline = [
        {"$group": {
            "_id": None,
            "avg_ai_readiness": {"$avg": "$ai_readiness_score"},
            "avg_opportunity_density": {"$avg": "$opportunity_density_score"},
            "avg_governance_sensitivity": {"$avg": "$governance_sensitivity_score"}
        }}
    ]
    avg_stats = await database.submissions.aggregate(avg_pipeline).to_list(1)
    
    pain_pipeline = [
        {"$unwind": "$workflow_pain_points"},
        {"$group": {"_id": "$workflow_pain_points", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    pain_stats = await database.submissions.aggregate(pain_pipeline).to_list(10)
    
    benefit_pipeline = [
        {"$unwind": "$areas_benefit_ai"},
        {"$group": {"_id": "$areas_benefit_ai", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    benefit_stats = await database.submissions.aggregate(benefit_pipeline).to_list(10)
    
    learning_pipeline = [
        {"$unwind": "$learning_expectations"},
        {"$group": {"_id": "$learning_expectations", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    learning_stats = await database.submissions.aggregate(learning_pipeline).to_list(10)
    
    tools_pipeline = [
        {"$unwind": "$ai_tools_used"},
        {"$group": {"_id": "$ai_tools_used", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    tools_stats = await database.submissions.aggregate(tools_pipeline).to_list(10)
    
    departments = await database.submissions.distinct("department")
    
    return {
        "total_submissions": total_submissions,
        "by_subsidiary": {item["_id"]: item["count"] for item in subsidiary_stats if item["_id"]},
        "by_readiness_band": {item["_id"]: item["count"] for item in band_stats if item["_id"]},
        "average_scores": avg_stats[0] if avg_stats else {},
        "top_pain_points": [{"name": item["_id"], "count": item["count"]} for item in pain_stats],
        "top_benefit_areas": [{"name": item["_id"], "count": item["count"]} for item in benefit_stats],
        "learning_expectations": [{"name": item["_id"], "count": item["count"]} for item in learning_stats],
        "ai_tools_usage": [{"name": item["_id"], "count": item["count"]} for item in tools_stats],
        "departments": departments
    }

@app.get("/api/admin/report")
async def get_comprehensive_report():
    database = get_db()
    total = await database.submissions.count_documents({})
    if total == 0:
        return {"message": "No submissions yet", "report": None, "total_submissions": 0}
    
    submissions = await database.submissions.find({}, {"_id": 0}).to_list(1000)
    
    avg_ai = sum(s.get('ai_readiness_score', 0) for s in submissions) / total
    avg_opp = sum(s.get('opportunity_density_score', 0) for s in submissions) / total
    avg_gov = sum(s.get('governance_sensitivity_score', 0) for s in submissions) / total
    
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
        count = subsidiary_stats[sub]['count']
        subsidiary_stats[sub]['avg_ai'] = round(subsidiary_stats[sub]['ai_total'] / count, 1)
        subsidiary_stats[sub]['avg_opp'] = round(subsidiary_stats[sub]['opp_total'] / count, 1)
        subsidiary_stats[sub]['avg_gov'] = round(subsidiary_stats[sub]['gov_total'] / count, 1)
    
    pain_points = {}
    for s in submissions:
        for pp in s.get('workflow_pain_points', []):
            pain_points[pp] = pain_points.get(pp, 0) + 1
    top_pain_points = sorted(pain_points.items(), key=lambda x: x[1], reverse=True)[:10]
    
    benefit_areas = {}
    for s in submissions:
        for ba in s.get('areas_benefit_ai', []):
            benefit_areas[ba] = benefit_areas.get(ba, 0) + 1
    top_benefit_areas = sorted(benefit_areas.items(), key=lambda x: x[1], reverse=True)[:10]
    
    learning_exp = {}
    for s in submissions:
        for le in s.get('learning_expectations', []):
            learning_exp[le] = learning_exp.get(le, 0) + 1
    top_learning = sorted(learning_exp.items(), key=lambda x: x[1], reverse=True)
    
    tools_usage = {}
    for s in submissions:
        for tool in s.get('ai_tools_used', []):
            tools_usage[tool] = tools_usage.get(tool, 0) + 1
    top_tools = sorted(tools_usage.items(), key=lambda x: x[1], reverse=True)
    
    capstone_themes = []
    for s in submissions:
        capstone = s.get('capstone_problem', '')
        if capstone:
            capstone_themes.append({
                'name': s.get('full_name', 'Unknown'),
                'subsidiary': s.get('subsidiary', ''),
                'department': s.get('department', ''),
                'problem': capstone[:200] + ('...' if len(capstone) > 200 else ''),
                'impact': s.get('capstone_impact', '')[:150] if s.get('capstone_impact') else ''
            })
    
    exec_summary = []
    
    if avg_ai >= 60:
        exec_summary.append({
            "type": "positive",
            "title": "Strong AI Foundation",
            "detail": f"The organization shows a solid AI readiness baseline with an average score of {avg_ai:.1f}/100."
        })
    elif avg_ai >= 40:
        exec_summary.append({
            "type": "neutral",
            "title": "Moderate AI Readiness",
            "detail": f"Average AI readiness of {avg_ai:.1f}/100 indicates mixed experience levels."
        })
    else:
        exec_summary.append({
            "type": "warning",
            "title": "Foundation Building Required",
            "detail": f"Average AI readiness of {avg_ai:.1f}/100 suggests most participants need fundamental AI education."
        })
    
    champions = bands.get('Champion Candidate', 0)
    applied = bands.get('Applied User', 0)
    if champions > 0 or applied > 0:
        exec_summary.append({
            "type": "positive",
            "title": f"{champions + applied} Advanced AI Users Identified",
            "detail": f"{champions} Champion Candidates and {applied} Applied Users can serve as peer mentors."
        })
    
    training_recs = []
    
    beginners = bands.get('Beginner', 0) + bands.get('Explorer', 0)
    if beginners > total * 0.5:
        training_recs.append({
            "priority": "High",
            "area": "AI Fundamentals",
            "recommendation": "Allocate significant time to AI basics and foundational concepts.",
            "rationale": f"{beginners} participants ({(beginners/total)*100:.0f}%) are at beginner/explorer level."
        })
    
    if top_pain_points:
        training_recs.append({
            "priority": "High",
            "area": "Practical Application",
            "recommendation": f"Include hands-on exercises addressing '{top_pain_points[0][0]}'.",
            "rationale": f"Reported by {top_pain_points[0][1]} participants ({(top_pain_points[0][1]/total)*100:.0f}%)."
        })
    
    if top_learning:
        training_recs.append({
            "priority": "Medium",
            "area": "Curriculum Focus",
            "recommendation": f"Prioritize '{top_learning[0][0]}' in the training agenda.",
            "rationale": f"Top learning expectation, selected by {top_learning[0][1]} participants."
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
        "top_pain_points": [{"name": pp[0], "count": pp[1], "percentage": round(pp[1]/total*100, 1)} for pp in top_pain_points],
        "top_benefit_areas": [{"name": ba[0], "count": ba[1], "percentage": round(ba[1]/total*100, 1)} for ba in top_benefit_areas],
        "learning_expectations": [{"name": le[0], "count": le[1], "percentage": round(le[1]/total*100, 1)} for le in top_learning],
        "ai_tools_adoption": [{"name": t[0], "count": t[1], "percentage": round(t[1]/total*100, 1)} for t in top_tools],
        "capstone_projects": capstone_themes,
        "training_recommendations": training_recs
    }

@app.get("/api/admin/export")
async def export_csv():
    database = get_db()
    submissions = await database.submissions.find({}, {"_id": 0}).to_list(10000)
    
    if not submissions:
        raise HTTPException(status_code=404, detail="No submissions to export")
    
    output = io.StringIO()
    
    fieldnames = [
        "id", "email", "full_name", "job_title", "subsidiary", "department",
        "years_in_role", "role_level", "ai_familiarity", "ai_tools_used",
        "usage_frequency", "prompt_confidence", "ai_readiness_score",
        "opportunity_density_score", "governance_sensitivity_score",
        "readiness_band", "submitted_at"
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for sub in submissions:
        row = {}
        for field in fieldnames:
            value = sub.get(field, "")
            if isinstance(value, list):
                row[field] = "; ".join(str(v) for v in value)
            else:
                row[field] = value
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leadway_submissions.csv"}
    )
