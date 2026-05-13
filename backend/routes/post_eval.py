from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from collections import Counter
import uuid
import io
import csv
from fpdf import FPDF

from database import db
from models import PostEvalDraftCreate, PostEvalSubmissionCreate

router = APIRouter()

@router.post("/post-eval-drafts")
async def save_post_eval_draft(draft_input: PostEvalDraftCreate):
    existing = await db.post_eval_drafts.find_one({"email": draft_input.email}, {"_id": 0})
    if existing:
        await db.post_eval_drafts.update_one(
            {"email": draft_input.email},
            {"$set": {"data": draft_input.data, "cohort": draft_input.cohort, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Draft updated", "email": draft_input.email}
    else:
        doc = {
            "id": str(uuid.uuid4()),
            "email": draft_input.email,
            "cohort": draft_input.cohort,
            "data": draft_input.data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.post_eval_drafts.insert_one(doc)
        return {"message": "Draft saved", "id": doc["id"], "email": draft_input.email}

@router.get("/post-eval-drafts/{email}")
async def get_post_eval_draft(email: str):
    draft = await db.post_eval_drafts.find_one({"email": email}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found")
    return draft

@router.post("/post-evaluations")
async def create_post_evaluation(submission: PostEvalSubmissionCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "email": submission.email,
        "cohort": submission.cohort,
        "data": submission.data,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.post_evaluations.insert_one(doc)
    await db.post_eval_drafts.delete_one({"email": submission.email})
    doc.pop("_id", None)
    return doc

@router.get("/post-evaluations")
async def get_post_evaluations(skip: int = 0, limit: int = 100, cohort: Optional[str] = None):
    query = {}
    if cohort:
        query["cohort"] = cohort
    evaluations = await db.post_evaluations.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.post_evaluations.count_documents(query)
    return {"evaluations": evaluations, "total": total}


@router.get("/admin/post-eval-stats")
async def get_post_eval_stats(cohort: Optional[str] = None):
    """Aggregate post-evaluation data for admin dashboard"""
    base_query = {"cohort": cohort} if cohort else {}
    total = await db.post_evaluations.count_documents(base_query)
    if total == 0:
        return {"total": 0, "message": "No post-evaluations yet"}

    evals = await db.post_evaluations.find(base_query, {"_id": 0}).to_list(1000)

    # NPS
    nps_scores = [e["data"].get("nps_score") for e in evals if e.get("data", {}).get("nps_score") is not None]
    nps_avg = round(sum(nps_scores) / len(nps_scores), 1) if nps_scores else 0
    nps_dist = {"promoters": 0, "passives": 0, "detractors": 0}
    for s in nps_scores:
        if s >= 9: nps_dist["promoters"] += 1
        elif s >= 7: nps_dist["passives"] += 1
        else: nps_dist["detractors"] += 1
    nps_net = round(((nps_dist["promoters"] - nps_dist["detractors"]) / len(nps_scores)) * 100) if nps_scores else 0

    # Readiness level distribution
    readiness_dist = {}
    for e in evals:
        rl = e.get("data", {}).get("readiness_level", "Unknown")
        readiness_dist[rl] = readiness_dist.get(rl, 0) + 1

    # Session ratings averages
    session_items = [
        "Day 1 Strategy Session", "Day 1 Claude + TABS-D Framework",
        "Day 2 GPTBots Agent Building", "Day 2 Gemini AI Automation",
        "Day 2 ElevenLabs Voice AI", "Day 3 Workflow Design",
        "Day 3 Capstone Build", "Overall Programme Quality"
    ]
    session_avgs = {}
    for item in session_items:
        vals = [e["data"]["session_ratings"][item] for e in evals if item in e.get("data", {}).get("session_ratings", {})]
        session_avgs[item] = round(sum(vals) / len(vals), 1) if vals else 0

    # Facilitator averages
    dims = ["expertise", "delivery", "facilitation", "immersive", "support"]
    fac1_avgs, fac2_avgs = {}, {}
    for d in dims:
        v1 = [e["data"]["facilitator1_ratings"][d] for e in evals if d in e.get("data", {}).get("facilitator1_ratings", {})]
        v2 = [e["data"]["facilitator2_ratings"][d] for e in evals if d in e.get("data", {}).get("facilitator2_ratings", {})]
        fac1_avgs[d] = round(sum(v1) / len(v1), 1) if v1 else 0
        fac2_avgs[d] = round(sum(v2) / len(v2), 1) if v2 else 0

    # Tool ratings averages
    all_tools = set()
    for e in evals:
        all_tools.update(e.get("data", {}).get("tool_ratings", {}).keys())
    tool_avgs = {}
    for tool in sorted(all_tools):
        vals = [e["data"]["tool_ratings"][tool] for e in evals if tool in e.get("data", {}).get("tool_ratings", {})]
        tool_avgs[tool] = round(sum(vals) / len(vals), 1) if vals else 0

    # Deployment status summary
    deploy_summary = {}
    for e in evals:
        for item, status in e.get("data", {}).get("deployment_status", {}).items():
            if item not in deploy_summary:
                deploy_summary[item] = {}
            deploy_summary[item][status] = deploy_summary[item].get(status, 0) + 1

    # Goals achieved frequency
    from collections import Counter
    goals_counter = Counter()
    for e in evals:
        for g in e.get("data", {}).get("goals_achieved", []):
            goals_counter[g] += 1
    goals_achieved = [{"name": k, "count": v, "percentage": round(v / total * 100, 1)} for k, v in goals_counter.most_common()]

    # One thing status
    one_thing_dist = {}
    for e in evals:
        ot = e.get("data", {}).get("one_thing_status", "")
        if ot:
            one_thing_dist[ot] = one_thing_dist.get(ot, 0) + 1

    # Submissions list summary
    submissions_list = []
    for e in evals:
        d = e.get("data", {})
        submissions_list.append({
            "id": e.get("id", ""),
            "email": e.get("email", ""),
            "full_name": d.get("full_name", "Unknown"),
            "subsidiary_department": d.get("subsidiary_department", ""),
            "readiness_level": d.get("readiness_level", ""),
            "nps_score": d.get("nps_score"),
            "submitted_at": e.get("submitted_at", "")
        })

    return {
        "total": total,
        "nps": {"average": nps_avg, "net_score": nps_net, "distribution": nps_dist},
        "readiness_distribution": readiness_dist,
        "session_ratings": session_avgs,
        "facilitator1_ratings": fac1_avgs,
        "facilitator2_ratings": fac2_avgs,
        "tool_averages": tool_avgs,
        "deployment_summary": deploy_summary,
        "goals_achieved": goals_achieved,
        "one_thing_status": one_thing_dist,
        "submissions": submissions_list,
        "programme_effectiveness": _compute_effectiveness(evals, total, session_avgs, nps_avg, nps_net, goals_achieved),
        "commitment_summary": _compute_commitments(evals, total),
        "feedback_highlights": _compute_feedback(evals),
        "agents_built_summary": _compute_agents(evals, total),
        "capability_shift_summary": _compute_capability_shift(evals, total),
    }


def _compute_effectiveness(evals, total, session_avgs, nps_avg, nps_net, goals_achieved):
    all_ratings = [v for v in session_avgs.values() if v > 0]
    overall_session_avg = round(sum(all_ratings) / len(all_ratings), 1) if all_ratings else 0
    goals_pcts = [g["percentage"] for g in goals_achieved]
    avg_goal_achievement = round(sum(goals_pcts) / len(goals_pcts), 1) if goals_pcts else 0
    # Programme score: weighted composite
    prog_score = round(((overall_session_avg / 5) * 30 + (nps_avg / 10) * 30 + (avg_goal_achievement / 100) * 40), 1)
    grade = "A+" if prog_score >= 90 else "A" if prog_score >= 80 else "B+" if prog_score >= 70 else "B" if prog_score >= 60 else "C" if prog_score >= 50 else "D"
    return {
        "overall_session_avg": overall_session_avg,
        "avg_goal_achievement": avg_goal_achievement,
        "programme_score": prog_score,
        "grade": grade,
        "nps_classification": "World Class" if nps_net >= 70 else "Excellent" if nps_net >= 50 else "Good" if nps_net >= 30 else "Needs Improvement"
    }


def _compute_commitments(evals, total):
    tools_committed = {}
    has_commitment = 0
    for e in evals:
        d = e.get("data", {})
        dt = d.get("daily_tool", "")
        if dt:
            has_commitment += 1
            tools_committed[dt] = tools_committed.get(dt, 0) + 1
    top_tools = sorted(tools_committed.items(), key=lambda x: -x[1])[:5]
    return {
        "participants_committed": has_commitment,
        "commitment_rate": round(has_commitment / total * 100, 1) if total else 0,
        "top_daily_tools": [{"tool": t, "count": c} for t, c in top_tools],
    }


def _compute_feedback(evals):
    most_valuable = []
    deeper_topics = []
    team_messages = []
    final_words_list = []
    for e in evals:
        d = e.get("data", {})
        name = d.get("full_name", "Participant")
        if d.get("most_valuable"):
            most_valuable.append({"name": name, "text": d["most_valuable"]})
        if d.get("deeper_cohort2"):
            deeper_topics.append({"name": name, "text": d["deeper_cohort2"]})
        if d.get("message_team"):
            team_messages.append({"name": name, "text": d["message_team"]})
        if d.get("final_words"):
            final_words_list.append({"name": name, "text": d["final_words"]})
    return {
        "most_valuable": most_valuable,
        "deeper_topics": deeper_topics,
        "team_messages": team_messages,
        "final_words": final_words_list,
    }


def _compute_agents(evals, total):
    from collections import Counter
    agent_counter = Counter()
    prompt_counter = Counter()
    for e in evals:
        d = e.get("data", {})
        for a in d.get("agents_built", []):
            agent_counter[a] += 1
        ps = d.get("prompt_status", "")
        if ps:
            prompt_counter[ps] += 1
    return {
        "agents_built": [{"name": k, "count": v, "percentage": round(v / total * 100, 1)} for k, v in agent_counter.most_common()],
        "prompt_status": [{"status": k, "count": v, "percentage": round(v / total * 100, 1)} for k, v in prompt_counter.most_common()],
    }


def _compute_capability_shift(evals, total):
    from collections import Counter
    challenge_counter = Counter()
    before_after = []
    for e in evals:
        d = e.get("data", {})
        for c in d.get("challenges_addressed", []):
            challenge_counter[c] += 1
        if d.get("before_after_ai"):
            before_after.append({"name": d.get("full_name", ""), "text": d["before_after_ai"]})
    return {
        "challenges_addressed": [{"name": k, "count": v, "percentage": round(v / total * 100, 1)} for k, v in challenge_counter.most_common()],
        "before_after_reflections": before_after,
    }


@router.get("/admin/post-eval-export")
async def export_post_eval_csv(cohort: Optional[str] = None):
    """Export all post-evaluation responses as CSV"""
    base_query = {"cohort": cohort} if cohort else {}
    evals = await db.post_evaluations.find(base_query, {"_id": 0}).to_list(1000)
    if not evals:
        raise HTTPException(status_code=404, detail="No evaluations to export")

    output = io.StringIO()
    fieldnames = [
        "email", "full_name", "job_title", "subsidiary_department", "years_in_role",
        "primary_function", "readiness_level", "ai_relationship", "barriers_removed",
        "tool_surprise", "tool_next_30", "prompt_status", "prompt_description",
        "agents_built", "biggest_impact", "one_thing_status", "before_after_ai",
        "daily_tool", "share_colleague", "obstacle_plan",
        "nps_score", "most_valuable", "deeper_cohort2", "message_team",
        "able_to", "advice_cohort2", "followup_interest", "final_words",
        "facilitator1_comment", "facilitator2_comment", "submitted_at",
    ]
    # Add tool rating columns
    tool_names = [
        "Claude (Anthropic) + TABS-D™", "ChatGPT", "Gemini AI Automation",
        "GPTBots — Agent Builder", "Microsoft Designer / Visual AI",
        "Knowledge Tools (NotebookLM)", "ElevenLabs Voice AI",
        "Microsoft Copilot", "Canva AI", "Any AI tool for data analysis"
    ]
    for t in tool_names:
        fieldnames.append(f"tool_rating_{t}")
    # Session rating columns
    session_items = [
        "Day 1 Strategy Session", "Day 1 Claude + TABS-D Framework",
        "Day 2 GPTBots Agent Building", "Day 2 Gemini AI Automation",
        "Day 2 ElevenLabs Voice AI", "Day 3 Workflow Design",
        "Day 3 Capstone Build", "Overall Programme Quality"
    ]
    for s in session_items:
        fieldnames.append(f"session_{s}")
    # Facilitator dimension columns
    dims = ["expertise", "delivery", "facilitation", "immersive", "support"]
    for d in dims:
        fieldnames.append(f"dr_achi_{d}")
    for d in dims:
        fieldnames.append(f"orimolade_{d}")
    fieldnames.append("goals_achieved")

    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for e in evals:
        d = e.get("data", {})
        row = {
            "email": e.get("email", ""),
            "submitted_at": e.get("submitted_at", ""),
        }
        # Flat fields
        for f in ["full_name", "job_title", "subsidiary_department", "years_in_role",
                   "primary_function", "readiness_level", "tool_surprise", "tool_next_30",
                   "prompt_status", "prompt_description", "biggest_impact", "one_thing_status",
                   "before_after_ai", "daily_tool", "share_colleague", "obstacle_plan",
                   "nps_score", "most_valuable", "deeper_cohort2", "message_team",
                   "able_to", "advice_cohort2", "final_words",
                   "facilitator1_comment", "facilitator2_comment"]:
            row[f] = d.get(f, "")
        # Array fields as pipe-separated
        row["ai_relationship"] = " | ".join(d.get("ai_relationship", []))
        row["barriers_removed"] = " | ".join(d.get("barriers_removed", []))
        row["agents_built"] = " | ".join(d.get("agents_built", []))
        row["followup_interest"] = " | ".join(d.get("followup_interest", []))
        row["goals_achieved"] = " | ".join(d.get("goals_achieved", []))
        # Tool ratings
        for t in tool_names:
            row[f"tool_rating_{t}"] = d.get("tool_ratings", {}).get(t, "")
        # Session ratings
        for s in session_items:
            row[f"session_{s}"] = d.get("session_ratings", {}).get(s, "")
        # Facilitator dimensions
        for dim in dims:
            row[f"dr_achi_{dim}"] = d.get("facilitator1_ratings", {}).get(dim, "")
            row[f"orimolade_{dim}"] = d.get("facilitator2_ratings", {}).get(dim, "")
        writer.writerow(row)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Leadway_Post_Evaluation_Responses.csv"}
    )


@router.get("/admin/post-eval-report/pdf")
async def export_post_eval_report_pdf(cohort: Optional[str] = None):
    """Generate consulting-grade PDF report for post-evaluation"""
    base_query = {"cohort": cohort} if cohort else {}
    total = await db.post_evaluations.count_documents(base_query)
    if total == 0:
        raise HTTPException(status_code=404, detail="No evaluations to generate report")

    evals = await db.post_evaluations.find(base_query, {"_id": 0}).to_list(1000)

    # ---- Compute all metrics ----
    from collections import Counter

    # NPS
    nps_scores = [e["data"].get("nps_score") for e in evals if e.get("data", {}).get("nps_score") is not None]
    nps_avg = round(sum(nps_scores) / len(nps_scores), 1) if nps_scores else 0
    nps_dist = {"Promoters (9-10)": 0, "Passives (7-8)": 0, "Detractors (0-6)": 0}
    for s in nps_scores:
        if s >= 9: nps_dist["Promoters (9-10)"] += 1
        elif s >= 7: nps_dist["Passives (7-8)"] += 1
        else: nps_dist["Detractors (0-6)"] += 1
    nps_net = round(((nps_dist["Promoters (9-10)"] - nps_dist["Detractors (0-6)"]) / len(nps_scores)) * 100) if nps_scores else 0

    # Readiness
    readiness_dist = Counter(e.get("data", {}).get("readiness_level", "Unknown") for e in evals)

    # Session ratings
    session_items = [
        "Day 1 Strategy Session", "Day 1 Claude + TABS-D Framework",
        "Day 2 GPTBots Agent Building", "Day 2 Gemini AI Automation",
        "Day 2 ElevenLabs Voice AI", "Day 3 Workflow Design",
        "Day 3 Capstone Build", "Overall Programme Quality"
    ]
    session_avgs = {}
    for item in session_items:
        vals = [e["data"]["session_ratings"][item] for e in evals if item in e.get("data", {}).get("session_ratings", {})]
        session_avgs[item] = round(sum(vals) / len(vals), 1) if vals else 0

    # Facilitator ratings
    dims = ["expertise", "delivery", "facilitation", "immersive", "support"]
    dim_labels = {"expertise": "Subject Matter Expertise", "delivery": "Delivery & Communication",
                  "facilitation": "Hands-On Facilitation", "immersive": "Immersive Experience", "support": "Participant Support"}
    fac1_avgs, fac2_avgs = {}, {}
    for d in dims:
        v1 = [e["data"]["facilitator1_ratings"][d] for e in evals if d in e.get("data", {}).get("facilitator1_ratings", {})]
        v2 = [e["data"]["facilitator2_ratings"][d] for e in evals if d in e.get("data", {}).get("facilitator2_ratings", {})]
        fac1_avgs[d] = round(sum(v1) / len(v1), 1) if v1 else 0
        fac2_avgs[d] = round(sum(v2) / len(v2), 1) if v2 else 0

    # Tool averages
    all_tools = set()
    for e in evals:
        all_tools.update(e.get("data", {}).get("tool_ratings", {}).keys())
    tool_avgs = {}
    for tool in sorted(all_tools):
        vals = [e["data"]["tool_ratings"][tool] for e in evals if tool in e.get("data", {}).get("tool_ratings", {})]
        tool_avgs[tool] = round(sum(vals) / len(vals), 1) if vals else 0

    # Deployment status
    deploy_items = [
        "Credit Life Claims Calculator", "Survey Track Monitoring System", "RFQ Automation Engine",
        "Vendor Portal", "Auto-Registration Claims Agent", "LooseGuard AI Component",
        "Claude Renewal Agent Skill", "Cross-Referral Intelligence Skill", "Customer Communication Skill",
        "ElevenLabs Voice Agent (Layo)", "Zapier + Gmail Pipeline", "Claude Projects Persistent Agent"
    ]
    deploy_statuses = ["Active Use", "In Testing", "In Progress", "Not Started", "Not Relevant"]
    deploy_data = {}
    for e in evals:
        for item, status in e.get("data", {}).get("deployment_status", {}).items():
            if item not in deploy_data:
                deploy_data[item] = Counter()
            deploy_data[item][status] += 1

    # Goals
    goals_counter = Counter()
    for e in evals:
        for g in e.get("data", {}).get("goals_achieved", []):
            goals_counter[g] += 1

    # Agents
    agent_counter = Counter()
    prompt_counter = Counter()
    for e in evals:
        d = e.get("data", {})
        for a in d.get("agents_built", []):
            agent_counter[a] += 1
        ps = d.get("prompt_status", "")
        if ps:
            prompt_counter[ps] += 1

    # Challenges
    challenge_counter = Counter()
    for e in evals:
        for c in e.get("data", {}).get("challenges_addressed", []):
            challenge_counter[c] += 1

    # One thing
    one_thing = Counter(e.get("data", {}).get("one_thing_status", "") for e in evals if e.get("data", {}).get("one_thing_status"))

    # Effectiveness
    all_sess = [v for v in session_avgs.values() if v > 0]
    overall_sess = round(sum(all_sess) / len(all_sess), 1) if all_sess else 0
    goals_pcts = [round(v / total * 100, 1) for v in goals_counter.values()]
    avg_goal = round(sum(goals_pcts) / len(goals_pcts), 1) if goals_pcts else 0
    prog_score = round(((overall_sess / 5) * 30 + (nps_avg / 10) * 30 + (avg_goal / 100) * 40), 1)
    grade = "A+" if prog_score >= 90 else "A" if prog_score >= 80 else "B+" if prog_score >= 70 else "B" if prog_score >= 60 else "C" if prog_score >= 50 else "D"
    nps_class = "World Class" if nps_net >= 70 else "Excellent" if nps_net >= 50 else "Good" if nps_net >= 30 else "Needs Improvement"

    # Commitments
    commitment_count = sum(1 for e in evals if e.get("data", {}).get("daily_tool"))
    tool_commits = Counter(e.get("data", {}).get("daily_tool", "") for e in evals if e.get("data", {}).get("daily_tool"))

    # ---- BUILD PDF ----
    pdf = ReportPDF('P', 'mm', 'A4')
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)

    # ========== COVER PAGE ==========
    pdf.add_page()
    pdf.ln(15)
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(*ReportPDF.NAVY)
    pdf.cell(0, 12, 'Post-Training Evaluation', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(*ReportPDF.GOLD)
    pdf.cell(0, 8, 'Consulting Impact Report', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*ReportPDF.GRAY)
    pdf.cell(0, 6, 'AI-Powered Enterprise Excellence Programme  |  Cohort 1', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, 'Leadway Group  |  April 13-15, 2026, Lagos', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f'Report Generated: {datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")}', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f'Total Respondents: {total}', align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Divider
    pdf.set_draw_color(*ReportPDF.GOLD)
    pdf.set_line_width(0.8)
    pdf.line(40, pdf.get_y(), 170, pdf.get_y())
    pdf.ln(8)

    # Programme grade badge
    pdf.set_fill_color(*ReportPDF.NAVY)
    x_center = 105
    pdf.rect(x_center - 30, pdf.get_y(), 60, 28, 'F')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*ReportPDF.GOLD)
    y_badge = pdf.get_y()
    pdf.set_xy(x_center - 30, y_badge + 3)
    pdf.cell(60, 5, 'PROGRAMME GRADE', align='C')
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(*ReportPDF.WHITE)
    pdf.set_xy(x_center - 30, y_badge + 9)
    pdf.cell(60, 12, grade, align='C')
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(*ReportPDF.GOLD)
    pdf.set_xy(x_center - 30, y_badge + 21)
    pdf.cell(60, 5, f'Score: {prog_score}/100', align='C')
    pdf.set_y(y_badge + 32)
    pdf.ln(3)

    # Key metrics row
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*ReportPDF.GRAY)
    metrics_text = f'NPS: {nps_avg}/10 ({nps_class})  |  Session Avg: {overall_sess}/5  |  Goal Achievement: {avg_goal}%  |  Commitment Rate: {round(commitment_count/total*100)}%'
    pdf.cell(0, 5, metrics_text, align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.cell(0, 4, 'Prepared by Cihan Digital Academy for Leadway Group', align='C', new_x="LMARGIN", new_y="NEXT")

    # ========== EXECUTIVE SUMMARY ==========
    pdf.add_page()
    pdf.section_title('1. EXECUTIVE SUMMARY')
    exec_summary = (
        f"The AI-Powered Enterprise Excellence Programme (Cohort 1) trained {total} participants across "
        f"the Leadway Group over three intensive days (April 13-15, 2026). This report presents the "
        f"post-training evaluation results.\n\n"
        f"KEY FINDINGS:\n"
        f"- Programme received a grade of {grade} ({prog_score}/100), reflecting {nps_class.lower()} participant satisfaction\n"
        f"- Net Promoter Score of {nps_net} classifies the programme as '{nps_class}'\n"
        f"- Average session rating: {overall_sess}/5 across all modules\n"
        f"- {avg_goal}% average learning goal achievement rate\n"
        f"- {round(commitment_count/total*100)}% of participants have committed to a 30-day AI adoption plan\n"
        f"- Most common post-training readiness level: {readiness_dist.most_common(1)[0][0] if readiness_dist else 'N/A'}"
    )
    pdf.body_text(exec_summary)

    # ========== NPS ANALYSIS ==========
    pdf.section_title('2. NET PROMOTER SCORE (NPS) ANALYSIS')
    pdf.sub_title('NPS Score Distribution')
    nps_headers = ["Category", "Count", "Percentage", "Score Range"]
    nps_rows = []
    for cat, count in nps_dist.items():
        pct = f"{round(count / len(nps_scores) * 100, 1)}%" if nps_scores else "0%"
        rng = "9-10" if "Promoter" in cat else "7-8" if "Passive" in cat else "0-6"
        nps_rows.append([cat, str(count), pct, rng])
    pdf.add_table(nps_headers, nps_rows, [60, 30, 40, 60])

    pdf.gold_label("Average NPS Score", f"{nps_avg} / 10")
    pdf.gold_label("Net Promoter Score", f"{nps_net}")
    pdf.gold_label("NPS Classification", nps_class)
    pdf.ln(2)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*ReportPDF.GRAY)
    pdf.multi_cell(0, 4, 'Benchmark: NPS > 70 = World Class | 50-69 = Excellent | 30-49 = Good | < 30 = Needs Improvement')
    pdf.ln(2)

    # ========== READINESS SHIFT ==========
    pdf.section_title('3. AI READINESS LEVEL DISTRIBUTION')
    readiness_order = ["Observer", "Experimenter", "Practitioner", "Integrator", "Champion"]
    r_headers = ["Readiness Level", "Count", "Percentage", "Description"]
    r_descs = {
        "Observer": "Watches but hasn't tried AI",
        "Experimenter": "Tried a few things inconsistently",
        "Practitioner": "Uses AI tools regularly",
        "Integrator": "AI embedded in daily workflows",
        "Champion": "Advocates, teaches, architects solutions"
    }
    r_rows = []
    for rl in readiness_order:
        c = readiness_dist.get(rl, 0)
        if c > 0:
            r_rows.append([rl, str(c), f"{round(c/total*100, 1)}%", r_descs.get(rl, "")])
    for rl in readiness_dist:
        if rl not in readiness_order and readiness_dist[rl] > 0:
            r_rows.append([rl, str(readiness_dist[rl]), f"{round(readiness_dist[rl]/total*100, 1)}%", ""])
    pdf.add_table(r_headers, r_rows, [35, 20, 30, 105])

    # ========== SESSION RATINGS ==========
    pdf.section_title('4. SESSION RATINGS')
    pdf.sub_title('Average Ratings by Session (1-5 Scale)')
    sorted_sessions = sorted(session_avgs.items(), key=lambda x: -x[1])
    for name, avg in sorted_sessions:
        pdf.score_bar(name[:45], round(avg / 5 * 100), 100)
    pdf.ln(2)
    top_session = sorted_sessions[0] if sorted_sessions else ("N/A", 0)
    bot_session = sorted_sessions[-1] if sorted_sessions else ("N/A", 0)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*ReportPDF.TEAL)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 4, pdf.safe(f'Highest rated: {top_session[0]} ({top_session[1]}/5)  |  Lowest rated: {bot_session[0]} ({bot_session[1]}/5)'))
    pdf.ln(2)

    # ========== FACILITATOR ASSESSMENT ==========
    pdf.section_title('5. FACILITATOR ASSESSMENT')

    pdf.sub_title('Dr. Celestine N. Achi — Lead Facilitator')
    fac1_overall = round(sum(fac1_avgs.values()) / len(fac1_avgs), 1) if fac1_avgs else 0
    pdf.gold_label("Overall Average", f"{fac1_overall} / 5")
    for d_key in dims:
        pdf.score_bar(f"  {dim_labels[d_key]}", round(fac1_avgs.get(d_key, 0) / 5 * 100), 100)
    pdf.ln(2)

    # Collect comments
    f1_comments = [e["data"].get("facilitator1_comment", "") for e in evals if e.get("data", {}).get("facilitator1_comment")]
    if f1_comments:
        pdf.set_font('Helvetica', 'I', 7)
        pdf.set_text_color(*ReportPDF.GRAY)
        for c in f1_comments[:5]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 3.5, pdf.safe(f'"{c[:120]}"'))
        pdf.ln(2)

    pdf.sub_title('Orimolade Oluwamuyemi A. FIIM - Co-Facilitator')
    fac2_overall = round(sum(fac2_avgs.values()) / len(fac2_avgs), 1) if fac2_avgs else 0
    pdf.gold_label("Overall Average", f"{fac2_overall} / 5")
    for d_key in dims:
        pdf.score_bar(f"  {dim_labels[d_key]}", round(fac2_avgs.get(d_key, 0) / 5 * 100), 100)
    pdf.ln(2)

    f2_comments = [e["data"].get("facilitator2_comment", "") for e in evals if e.get("data", {}).get("facilitator2_comment")]
    if f2_comments:
        pdf.set_font('Helvetica', 'I', 7)
        pdf.set_text_color(*ReportPDF.GRAY)
        for c in f2_comments[:5]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 3.5, pdf.safe(f'"{c[:120]}"'))
        pdf.ln(2)

    # ========== TOOL ADOPTION ==========
    pdf.section_title('6. TOOL COMFORT & ADOPTION')
    pdf.sub_title('Average Comfort Rating by Tool (1-5 Scale)')
    sorted_tools = sorted(tool_avgs.items(), key=lambda x: -x[1])
    for tool, avg in sorted_tools:
        pdf.score_bar(tool[:45], round(avg / 5 * 100), 100)
    pdf.ln(2)

    # ========== DEPLOYMENT STATUS ==========
    pdf.section_title('7. BUILD & DEPLOYMENT STATUS')
    if deploy_data:
        dep_headers = ["Build/Solution"] + deploy_statuses
        dep_rows = []
        for item in deploy_items:
            if item in deploy_data:
                row = [item[:35]]
                for s in deploy_statuses:
                    row.append(str(deploy_data[item].get(s, 0)))
                dep_rows.append(row)
        if dep_rows:
            w = [55] + [27] * 5
            pdf.add_table(dep_headers, dep_rows, w)
    else:
        pdf.body_text("No deployment data recorded.")

    # Agents built
    if agent_counter:
        pdf.sub_title('Agents Built by Participants')
        pdf.ranked_list([{"name": k, "count": v, "percentage": round(v/total*100, 1)} for k, v in agent_counter.most_common()])
        pdf.ln(2)

    # ========== GOALS ACHIEVEMENT ==========
    pdf.section_title('8. LEARNING GOALS ACHIEVEMENT')
    if goals_counter:
        pdf.sub_title('Goals Reported as Achieved')
        goals_list = [{"name": k, "count": v, "percentage": round(v/total*100, 1)} for k, v in goals_counter.most_common()]
        pdf.ranked_list(goals_list)
        pdf.ln(2)

    # One thing
    if one_thing:
        pdf.sub_title('"The One Thing" Resolution Status')
        ot_headers = ["Status", "Count", "Percentage"]
        ot_rows = [[k, str(v), f"{round(v/total*100,1)}%"] for k, v in one_thing.most_common()]
        pdf.add_table(ot_headers, ot_rows, [90, 30, 70])

    # ========== CAPABILITY SHIFT ==========
    pdf.section_title('9. CAPABILITY SHIFT & WORKPLACE IMPACT')
    if challenge_counter:
        pdf.sub_title('Workplace Challenges Now Being Addressed')
        pdf.ranked_list([{"name": k, "count": v, "percentage": round(v/total*100, 1)} for k, v in challenge_counter.most_common()])
        pdf.ln(2)

    # Before/after reflections
    before_after = [(e["data"].get("full_name", ""), e["data"].get("before_after_ai", ""))
                    for e in evals if e.get("data", {}).get("before_after_ai")]
    if before_after:
        pdf.sub_title('Before & After Reflections (Selected)')
        pdf.set_font('Helvetica', 'I', 7.5)
        pdf.set_text_color(*ReportPDF.DARK)
        for name, text in before_after[:6]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 4, pdf.safe(f'{name}: "{text[:150]}"'))
            pdf.ln(1)
        pdf.ln(1)

    # ========== 30-DAY COMMITMENTS ==========
    pdf.section_title('10. 30-DAY COMMITMENT TRACKER')
    pdf.gold_label("Participants with Commitments", f"{commitment_count} / {total} ({round(commitment_count/total*100)}%)")
    if tool_commits:
        pdf.ln(1)
        pdf.sub_title('Most Committed Daily Tools')
        pdf.ranked_list([{"name": k, "count": v, "percentage": round(v/total*100, 1)} for k, v in tool_commits.most_common(5)])
        pdf.ln(2)

    # Commitment details
    commit_details = []
    for e in evals:
        d = e.get("data", {})
        if d.get("daily_tool"):
            commit_details.append([
                d.get("full_name", "")[:20],
                d.get("daily_tool", "")[:35],
                d.get("share_colleague", "")[:20]
            ])
    if commit_details:
        pdf.sub_title('Individual Commitments')
        pdf.add_table(["Participant", "Daily Tool/Workflow", "Sharing With"], commit_details, [35, 90, 65])

    # ========== OPEN FEEDBACK ==========
    pdf.section_title('11. PARTICIPANT FEEDBACK & TESTIMONIALS')

    most_valuable = [(e["data"].get("full_name", ""), e["data"].get("most_valuable", ""))
                     for e in evals if e.get("data", {}).get("most_valuable")]
    if most_valuable:
        pdf.sub_title('Most Valuable Learning or Build')
        pdf.set_font('Helvetica', 'I', 7.5)
        pdf.set_text_color(*ReportPDF.DARK)
        for name, text in most_valuable[:8]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 4, pdf.safe(f'{name}: "{text[:150]}"'))
            pdf.ln(1)
        pdf.ln(1)

    deeper = [(e["data"].get("full_name", ""), e["data"].get("deeper_cohort2", ""))
              for e in evals if e.get("data", {}).get("deeper_cohort2")]
    if deeper:
        pdf.sub_title('Topics to Go Deeper in Cohort 2')
        pdf.set_font('Helvetica', 'I', 7.5)
        pdf.set_text_color(*ReportPDF.DARK)
        for name, text in deeper[:8]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 4, pdf.safe(f'{name}: "{text[:150]}"'))
            pdf.ln(1)
        pdf.ln(1)

    team_msgs = [(e["data"].get("full_name", ""), e["data"].get("message_team", ""))
                 for e in evals if e.get("data", {}).get("message_team")]
    if team_msgs:
        pdf.sub_title('Messages to the Facilitation Team')
        pdf.set_font('Helvetica', 'I', 7.5)
        pdf.set_text_color(*ReportPDF.DARK)
        for name, text in team_msgs[:8]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 4, pdf.safe(f'{name}: "{text[:150]}"'))
            pdf.ln(1)
        pdf.ln(1)

    final_w = [(e["data"].get("full_name", ""), e["data"].get("final_words", ""))
               for e in evals if e.get("data", {}).get("final_words")]
    if final_w:
        pdf.sub_title('Final Words')
        pdf.set_font('Helvetica', 'I', 7.5)
        pdf.set_text_color(*ReportPDF.DARK)
        for name, text in final_w[:8]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 4, pdf.safe(f'{name}: "{text[:150]}"'))
            pdf.ln(1)
        pdf.ln(1)

    # ========== RECOMMENDATIONS ==========
    pdf.section_title('12. RECOMMENDATIONS FOR COHORT 2')
    recs = [
        f"1. Maintain the high-impact session format. '{top_session[0]}' was the highest rated session ({top_session[1]}/5); consider expanding this module.",
        f"2. Address the lower-rated session '{bot_session[0]}' ({bot_session[1]}/5) — review pacing, content depth, or add more hands-on exercises.",
        f"3. With an NPS of {nps_net} ({nps_class}), leverage promoters as ambassadors for Cohort 2 recruitment.",
        f"4. {commitment_count} of {total} participants have 30-day commitments — schedule a Vanguard Check-In at Week 2 and Week 4 to sustain momentum.",
        f"5. Focus Cohort 2 deeper-dive sessions on topics highlighted by participants in their feedback.",
    ]
    for rec in recs:
        pdf.body_text(rec)

    # ========== INDIVIDUAL SCORES ==========
    pdf.section_title('13. INDIVIDUAL PARTICIPANT SUMMARY')
    ind_headers = ["Name", "Department", "Readiness", "NPS", "Goals", "Commitment"]
    ind_rows = []
    for e in evals:
        d = e.get("data", {})
        goals_count = len(d.get("goals_achieved", []))
        has_commit = "Yes" if d.get("daily_tool") else "No"
        ind_rows.append([
            d.get("full_name", "")[:22],
            d.get("subsidiary_department", "")[:25],
            d.get("readiness_level", "")[:12],
            str(d.get("nps_score", "")),
            str(goals_count),
            has_commit
        ])
    pdf.add_table(ind_headers, ind_rows, [38, 45, 28, 18, 18, 43])

    # ========== DISCLAIMER ==========
    pdf.ln(5)
    pdf.set_draw_color(*ReportPDF.GOLD)
    pdf.set_line_width(0.3)
    pdf.line(30, pdf.get_y(), 180, pdf.get_y())
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.set_text_color(*ReportPDF.GRAY)
    pdf.multi_cell(0, 4,
        'This consulting impact report was generated by the Leadway AI Readiness & Opportunity Scan platform. '
        'All data is based on self-reported participant responses collected during the post-training evaluation. '
        'Scores, grades, and classifications follow established consulting frameworks (NPS by Bain & Company, '
        'Programme Effectiveness Index by Cihan Digital Academy). '
        'Prepared by Cihan Digital Academy for Leadway Group. (c) 2026 Cihan Digital Academy.'
    )

    pdf_bytes = pdf.output()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Leadway_Post_Evaluation_Report.pdf"}
    )

