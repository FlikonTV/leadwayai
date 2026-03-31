from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import io
import csv
import os

# Create FastAPI app
app = FastAPI()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', '')
DB_NAME = os.environ.get('DB_NAME', 'leadway_ai_readiness')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'leadway2026')

client = None
db = None

def get_db():
    global client, db
    if client is None:
        client = MongoClient(MONGO_URL)
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
class DraftCreate(BaseModel):
    email: str
    data: Dict[str, Any] = {}

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
def calculate_ai_readiness_score(data: dict):
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

def calculate_opportunity_density_score(data: dict):
    breakdown = {}
    breakdown['pain_points_count'] = min(len(data.get('workflow_pain_points', [])) * 5, 25)
    breakdown['repetitive_tasks_detail'] = min(len(data.get('repetitive_tasks', '')) / 20, 15)
    breakdown['benefit_areas_count'] = min(len(data.get('areas_benefit_ai', [])) * 5, 25)
    breakdown['capstone_quality'] = min(len(data.get('capstone_problem', '')) / 25, 20)
    breakdown['success_clarity'] = min(len(data.get('success_definition', '')) / 20, 15)
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown

def calculate_governance_sensitivity_score(data: dict):
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

def generate_insights(data: dict, ai_score: float, gov_score: float) -> List[str]:
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
    
    if gov_score >= 60:
        insights.append("Strong governance awareness - suitable for responsible AI champion role.")
    
    return insights[:5]

def generate_recommendations(data: dict, ai_score: float) -> List[str]:
    recommendations = []
    band = get_readiness_band(ai_score)
    
    if band in ["Beginner", "Explorer"]:
        recommendations.append("Start with AI fundamentals module and basic prompt engineering exercises.")
    elif band in ["Emerging Practitioner", "Applied User"]:
        recommendations.append("Focus on advanced prompt techniques and workflow integration.")
    else:
        recommendations.append("Consider taking a mentorship role during the training.")
    
    pain_points = data.get('workflow_pain_points', [])
    if "Report generation" in pain_points:
        recommendations.append("Prioritize learning AI-assisted report automation techniques.")
    if "Document processing" in pain_points:
        recommendations.append("Explore document AI and extraction capabilities in training.")
    
    return recommendations[:5]

def identify_training_focus_areas(data: dict) -> List[str]:
    focus_areas = []
    expectations = data.get('learning_expectations', [])
    mapping = {
        "Understanding AI fundamentals": "AI Fundamentals & Concepts",
        "Hands-on prompt engineering": "Prompt Engineering Workshop",
        "AI use case identification": "Use Case Discovery",
        "Responsible AI practices": "AI Ethics & Governance",
        "AI implementation strategies": "Implementation Planning",
    }
    for exp in expectations:
        if exp in mapping:
            focus_areas.append(mapping[exp])
    return list(set(focus_areas))[:6]


# Routes
@app.get("/api")
def root():
    return {"message": "Leadway AI Readiness API"}

@app.get("/api/subsidiaries")
def get_subsidiaries():
    return {"subsidiaries": SUBSIDIARIES}

@app.post("/api/drafts")
def save_draft(draft_input: DraftCreate):
    database = get_db()
    existing = database.drafts.find_one({"email": draft_input.email}, {"_id": 0})
    if existing:
        database.drafts.update_one(
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
        database.drafts.insert_one(doc)
        return {"message": "Draft saved", "id": doc["id"], "email": draft_input.email}

@app.get("/api/drafts/{email}")
def get_draft(email: str):
    database = get_db()
    draft = database.drafts.find_one({"email": email}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found")
    return draft

@app.post("/api/submissions")
def create_submission(submission_input: SubmissionCreate):
    database = get_db()
    data = submission_input.model_dump()
    
    ai_readiness, ai_breakdown = calculate_ai_readiness_score(data)
    opportunity_density, opp_breakdown = calculate_opportunity_density_score(data)
    governance_sensitivity, gov_breakdown = calculate_governance_sensitivity_score(data)
    readiness_band = get_readiness_band(ai_readiness)
    
    insights = generate_insights(data, ai_readiness, governance_sensitivity)
    recommendations = generate_recommendations(data, ai_readiness)
    training_focus = identify_training_focus_areas(data)
    
    submission = {
        "id": str(uuid.uuid4()),
        **data,
        "ai_readiness_score": ai_readiness,
        "ai_readiness_breakdown": ai_breakdown,
        "opportunity_density_score": opportunity_density,
        "opportunity_breakdown": opp_breakdown,
        "governance_sensitivity_score": governance_sensitivity,
        "governance_breakdown": gov_breakdown,
        "readiness_band": readiness_band,
        "insights": insights,
        "recommendations": recommendations,
        "training_focus_areas": training_focus,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    database.submissions.insert_one(submission)
    database.drafts.delete_one({"email": submission_input.email})
    
    # Remove _id before returning
    submission.pop("_id", None)
    return submission

@app.get("/api/submissions")
def get_submissions(
    subsidiary: Optional[str] = None,
    readiness_band: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    database = get_db()
    query = {}
    if subsidiary:
        query["subsidiary"] = subsidiary
    if readiness_band:
        query["readiness_band"] = readiness_band
    
    submissions = list(database.submissions.find(query, {"_id": 0}).skip(skip).limit(limit))
    total = database.submissions.count_documents(query)
    
    return {"submissions": submissions, "total": total}

@app.get("/api/submissions/{submission_id}")
def get_submission(submission_id: str):
    database = get_db()
    submission = database.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

@app.post("/api/admin/login")
def admin_login(login: AdminLogin):
    if login.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/admin/stats")
def get_admin_stats():
    database = get_db()
    total_submissions = database.submissions.count_documents({})
    
    subsidiary_pipeline = [{"$group": {"_id": "$subsidiary", "count": {"$sum": 1}}}]
    subsidiary_stats = list(database.submissions.aggregate(subsidiary_pipeline))
    
    band_pipeline = [{"$group": {"_id": "$readiness_band", "count": {"$sum": 1}}}]
    band_stats = list(database.submissions.aggregate(band_pipeline))
    
    avg_pipeline = [
        {"$group": {
            "_id": None,
            "avg_ai_readiness": {"$avg": "$ai_readiness_score"},
            "avg_opportunity_density": {"$avg": "$opportunity_density_score"},
            "avg_governance_sensitivity": {"$avg": "$governance_sensitivity_score"}
        }}
    ]
    avg_stats = list(database.submissions.aggregate(avg_pipeline))
    
    pain_pipeline = [
        {"$unwind": "$workflow_pain_points"},
        {"$group": {"_id": "$workflow_pain_points", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    pain_stats = list(database.submissions.aggregate(pain_pipeline))
    
    benefit_pipeline = [
        {"$unwind": "$areas_benefit_ai"},
        {"$group": {"_id": "$areas_benefit_ai", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    benefit_stats = list(database.submissions.aggregate(benefit_pipeline))
    
    learning_pipeline = [
        {"$unwind": "$learning_expectations"},
        {"$group": {"_id": "$learning_expectations", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    learning_stats = list(database.submissions.aggregate(learning_pipeline))
    
    tools_pipeline = [
        {"$unwind": "$ai_tools_used"},
        {"$group": {"_id": "$ai_tools_used", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    tools_stats = list(database.submissions.aggregate(tools_pipeline))
    
    return {
        "total_submissions": total_submissions,
        "by_subsidiary": {item["_id"]: item["count"] for item in subsidiary_stats if item["_id"]},
        "by_readiness_band": {item["_id"]: item["count"] for item in band_stats if item["_id"]},
        "average_scores": avg_stats[0] if avg_stats else {},
        "top_pain_points": [{"name": item["_id"], "count": item["count"]} for item in pain_stats],
        "top_benefit_areas": [{"name": item["_id"], "count": item["count"]} for item in benefit_stats],
        "learning_expectations": [{"name": item["_id"], "count": item["count"]} for item in learning_stats],
        "ai_tools_usage": [{"name": item["_id"], "count": item["count"]} for item in tools_stats],
    }

@app.get("/api/admin/report")
def get_comprehensive_report():
    database = get_db()
    total = database.submissions.count_documents({})
    if total == 0:
        return {"message": "No submissions yet", "total_submissions": 0}
    
    submissions = list(database.submissions.find({}, {"_id": 0}))
    
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
                'problem': capstone[:200] + ('...' if len(capstone) > 200 else ''),
                'impact': (s.get('capstone_impact', '') or '')[:150]
            })
    
    exec_summary = []
    if avg_ai >= 60:
        exec_summary.append({"type": "positive", "title": "Strong AI Foundation", "detail": f"Average score of {avg_ai:.1f}/100."})
    elif avg_ai >= 40:
        exec_summary.append({"type": "neutral", "title": "Moderate AI Readiness", "detail": f"Average of {avg_ai:.1f}/100 indicates mixed experience."})
    else:
        exec_summary.append({"type": "warning", "title": "Foundation Building Required", "detail": f"Average of {avg_ai:.1f}/100 suggests need for fundamentals."})
    
    champions = bands.get('Champion Candidate', 0) + bands.get('Applied User', 0)
    if champions > 0:
        exec_summary.append({"type": "positive", "title": f"{champions} Advanced Users", "detail": "Can serve as peer mentors."})
    
    training_recs = []
    beginners = bands.get('Beginner', 0) + bands.get('Explorer', 0)
    if beginners > total * 0.5:
        training_recs.append({"priority": "High", "area": "AI Fundamentals", "recommendation": "Allocate time to basics.", "rationale": f"{beginners} at beginner level."})
    
    if top_pain_points:
        training_recs.append({"priority": "High", "area": "Practical Application", "recommendation": f"Address '{top_pain_points[0][0]}'.", "rationale": f"Top pain point."})
    
    return {
        "total_submissions": total,
        "executive_summary": exec_summary,
        "overall_scores": {"ai_readiness": round(avg_ai, 1), "opportunity_density": round(avg_opp, 1), "governance_sensitivity": round(avg_gov, 1)},
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
def export_csv():
    database = get_db()
    submissions = list(database.submissions.find({}, {"_id": 0}).limit(10000))
    
    if not submissions:
        raise HTTPException(status_code=404, detail="No submissions to export")
    
    output = io.StringIO()
    fieldnames = ["id", "email", "full_name", "job_title", "subsidiary", "department", "ai_readiness_score", "opportunity_density_score", "governance_sensitivity_score", "readiness_band", "submitted_at"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for sub in submissions:
        row = {field: sub.get(field, "") for field in fieldnames}
        writer.writerow(row)
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leadway_submissions.csv"}
    )
