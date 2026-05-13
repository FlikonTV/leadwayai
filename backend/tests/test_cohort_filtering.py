import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-readiness-scan.preview.emergentagent.com').rstrip('/')

SAMPLE_SUB = {
    "email": "TEST_cohort_{c}@leadway.com",
    "full_name": "Cohort Test",
    "job_title": "Analyst",
    "subsidiary": "Leadway Assurance",
    "department": "Risk",
    "years_in_role": "1-3 years",
    "role_level": "Manager",
    "ai_familiarity": 3,
    "ai_tools_used": ["ChatGPT"],
    "usage_frequency": "Weekly",
    "prompt_confidence": 3,
    "data_boundaries_understanding": 3,
    "workflow_pain_points": ["Report generation"],
    "areas_benefit_ai": ["Reporting"],
    "governance_concerns": ["Privacy"],
    "privacy_awareness": 4,
    "compliance_awareness": 4,
    "learning_expectations": ["Hands-on prompt engineering"],
    "capstone_problem": "x" * 100,
    "success_definition": "y" * 50,
}


@pytest.fixture(scope="module")
def seeded():
    created = {}
    for c in ["cohort_1_lagos", "cohort_2_abuja"]:
        body = dict(SAMPLE_SUB)
        body["email"] = f"TEST_cohort_{c}@leadway.com"
        body["cohort"] = c
        r = requests.post(f"{BASE_URL}/api/submissions", json=body, timeout=30)
        assert r.status_code == 200, r.text
        created[c] = r.json()
    # Seed post-eval
    pe = {}
    for c in ["cohort_1_lagos", "cohort_2_abuja"]:
        body = {
            "email": f"TEST_pe_{c}@leadway.com",
            "cohort": c,
            "data": {"full_name": f"PE {c}", "nps_score": 9, "readiness_level": "Practitioner"}
        }
        r = requests.post(f"{BASE_URL}/api/post-evaluations", json=body, timeout=30)
        assert r.status_code == 200, r.text
        pe[c] = r.json()
    yield {"sub": created, "pe": pe}


def test_submissions_cohort_persisted(seeded):
    for c, sub in seeded["sub"].items():
        assert sub["cohort"] == c


def test_post_eval_cohort_persisted(seeded):
    for c, pe in seeded["pe"].items():
        assert pe["cohort"] == c


def test_stats_filter_by_cohort(seeded):
    r1 = requests.get(f"{BASE_URL}/api/admin/stats", params={"cohort": "cohort_1_lagos"}, timeout=30)
    r2 = requests.get(f"{BASE_URL}/api/admin/stats", params={"cohort": "cohort_2_abuja"}, timeout=30)
    rall = requests.get(f"{BASE_URL}/api/admin/stats", timeout=30)
    assert r1.status_code == 200 and r2.status_code == 200 and rall.status_code == 200
    t1 = r1.json()["total_submissions"]
    t2 = r2.json()["total_submissions"]
    tall = rall.json()["total_submissions"]
    assert t1 >= 1 and t2 >= 1
    assert tall >= t1 + t2 - 0  # all >= sum (other test data may also exist)


def test_submissions_listing_filter(seeded):
    r = requests.get(f"{BASE_URL}/api/submissions", params={"cohort": "cohort_1_lagos", "limit": 100}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    for s in data["submissions"]:
        assert s.get("cohort") == "cohort_1_lagos"


def test_post_eval_stats_filter(seeded):
    r = requests.get(f"{BASE_URL}/api/admin/post-eval-stats", params={"cohort": "cohort_1_lagos"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("total", 0) >= 1


def test_export_csv_filter(seeded):
    r = requests.get(f"{BASE_URL}/api/admin/export", params={"cohort": "cohort_1_lagos"}, timeout=30)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert b"TEST_cohort_cohort_1_lagos" in r.content


def test_post_eval_export_filter(seeded):
    r = requests.get(f"{BASE_URL}/api/admin/post-eval-export", params={"cohort": "cohort_2_abuja"}, timeout=30)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")


def test_admin_login():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "leadway2026"}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("success") is True
    rbad = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong"}, timeout=15)
    assert rbad.status_code == 401


def test_cohorts_endpoint():
    r = requests.get(f"{BASE_URL}/api/cohorts", timeout=15)
    assert r.status_code == 200
    cohorts = r.json()["cohorts"]
    assert "cohort_1_lagos" in cohorts and "cohort_2_abuja" in cohorts
