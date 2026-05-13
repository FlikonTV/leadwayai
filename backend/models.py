from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone


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
    cohort: str = "cohort_2_abuja"
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
    cohort: str = "cohort_2_abuja"
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


class PostEvalDraftCreate(BaseModel):
    email: str
    cohort: str = "cohort_1_lagos"
    data: Dict[str, Any] = {}


class PostEvalSubmissionCreate(BaseModel):
    email: str
    cohort: str = "cohort_1_lagos"
    data: Dict[str, Any] = {}
