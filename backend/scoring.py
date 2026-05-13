from typing import List, Dict


def calculate_ai_readiness_score(data: dict) -> tuple[float, Dict[str, float]]:
    breakdown = {}
    familiarity = data.get('ai_familiarity', 1)
    breakdown['familiarity'] = round((familiarity - 1) * 6.25, 1)
    tools = data.get('ai_tools_used', [])
    breakdown['tools_experience'] = round(min(len(tools) * 2.5, 20), 1)
    freq_map = {"Never": 0, "Rarely": 5, "Monthly": 10, "Weekly": 15, "Daily": 20}
    breakdown['usage_frequency'] = freq_map.get(data.get('usage_frequency', 'Never'), 0)
    confidence = data.get('prompt_confidence', 1)
    breakdown['prompt_confidence'] = round((confidence - 1) * 5, 1)
    boundaries = data.get('data_boundaries_understanding', 1)
    breakdown['data_understanding'] = round((boundaries - 1) * 3.75, 1)
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown


def calculate_opportunity_density_score(data: dict) -> tuple[float, Dict[str, float]]:
    breakdown = {}
    pain_points = data.get('workflow_pain_points', [])
    breakdown['pain_points_count'] = min(len(pain_points) * 5, 25)
    rep_tasks = data.get('repetitive_tasks', '')
    breakdown['repetitive_tasks_detail'] = min(len(rep_tasks) / 20, 15)
    areas = data.get('areas_benefit_ai', [])
    breakdown['benefit_areas_count'] = min(len(areas) * 5, 25)
    capstone = data.get('capstone_problem', '')
    breakdown['capstone_quality'] = min(len(capstone) / 25, 20)
    success = data.get('success_definition', '')
    breakdown['success_clarity'] = min(len(success) / 20, 15)
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown


def calculate_governance_sensitivity_score(data: dict) -> tuple[float, Dict[str, float]]:
    breakdown = {}
    concerns = data.get('governance_concerns', [])
    breakdown['concerns_awareness'] = min(len(concerns) * 6, 30)
    privacy = data.get('privacy_awareness', 1)
    breakdown['privacy_awareness'] = round((privacy - 1) * 6.25, 1)
    compliance = data.get('compliance_awareness', 1)
    breakdown['compliance_understanding'] = round((compliance - 1) * 6.25, 1)
    never_ai = data.get('never_fully_ai', '')
    breakdown['human_oversight'] = min(len(never_ai) / 15, 20)
    breakdown = {k: round(v, 1) for k, v in breakdown.items()}
    total = sum(breakdown.values())
    return min(round(total, 1), 100), breakdown


def get_readiness_band(score: float) -> str:
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
    elif freq == 'Never':
        insights.append("First-time AI exposure expected - focus on fundamentals and quick wins.")
    pain_points = data.get('workflow_pain_points', [])
    if len(pain_points) >= 4:
        insights.append(f"High opportunity density with {len(pain_points)} pain points identified for AI automation.")
    capstone = data.get('capstone_problem', '')
    if len(capstone) > 200:
        insights.append("Well-articulated capstone problem shows clear vision for AI application.")
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
    if "Customer inquiries" in pain_points:
        recommendations.append("Focus on conversational AI and customer service automation.")
    style = data.get('preferred_learning_style', '')
    if style == "Hands-on practice":
        recommendations.append("Engage actively in workshop exercises and build your own prompts.")
    elif style == "Case studies":
        recommendations.append("Pay special attention to industry case studies and real-world examples.")
    return recommendations[:5]


def identify_training_focus_areas(data: dict) -> List[str]:
    focus_areas = []
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
    role = data.get('role_level', '')
    if role in ["Director", "Executive"]:
        focus_areas.append("AI Strategy & Leadership")
    elif role in ["Manager", "Senior Manager"]:
        focus_areas.append("Team AI Enablement")
    concerns = data.get('governance_concerns', [])
    if len(concerns) >= 3:
        focus_areas.append("Risk & Compliance in AI")
    return list(set(focus_areas))[:6]
