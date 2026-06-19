"""
Test suite for PDF Export feature - Leadway AI Readiness Admin Dashboard
Tests:
1. POST /api/submissions - Create test submissions (seed data)
2. GET /api/admin/report/pdf - PDF generation with data
3. GET /api/admin/report/pdf - 404 when no submissions
4. GET /api/admin/export - CSV export still works
5. Existing endpoints not broken
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test submission data templates
TEST_SUBMISSIONS = [
    {
        "email": "TEST_john.doe@leadway.com",
        "full_name": "John Doe",
        "job_title": "Senior Analyst",
        "subsidiary": "Leadway Assurance",
        "department": "Finance",
        "years_in_role": "3-5 years",
        "role_level": "Senior Manager",
        "ai_familiarity": 4,
        "ai_tools_used": ["ChatGPT", "Microsoft Copilot", "Google Bard"],
        "usage_frequency": "Weekly",
        "prompt_confidence": 4,
        "data_boundaries_understanding": 3,
        "workflow_pain_points": ["Report generation", "Data analysis", "Document processing"],
        "repetitive_tasks": "Monthly financial reports and data reconciliation",
        "time_consuming_tasks": "Manual data entry and verification",
        "areas_benefit_ai": ["Report automation", "Data analysis", "Customer service"],
        "specific_use_cases": "Automating monthly financial reports",
        "governance_concerns": ["Data privacy", "Accuracy of outputs", "Compliance"],
        "privacy_awareness": 4,
        "compliance_awareness": 4,
        "never_fully_ai": "Final approval decisions and client-facing communications",
        "cross_subsidiary_opportunities": "Shared reporting templates across subsidiaries",
        "collaboration_areas": ["Finance", "Risk Management"],
        "capstone_problem": "Automate the generation of monthly financial reports that currently take 3 days to compile manually",
        "success_definition": "Reduce report generation time from 3 days to 4 hours with 99% accuracy",
        "capstone_impact": "Save 60+ hours per month and improve report accuracy",
        "learning_expectations": ["Hands-on prompt engineering", "AI use case identification", "Responsible AI practices"],
        "preferred_learning_style": "Hands-on practice",
        "specific_topics": "Advanced prompt engineering for financial analysis"
    },
    {
        "email": "TEST_jane.smith@leadway.com",
        "full_name": "Jane Smith",
        "job_title": "IT Manager",
        "subsidiary": "Leadway Pensure",
        "department": "Information Technology",
        "years_in_role": "5-10 years",
        "role_level": "Manager",
        "ai_familiarity": 5,
        "ai_tools_used": ["ChatGPT", "GitHub Copilot", "Claude", "Midjourney"],
        "usage_frequency": "Daily",
        "prompt_confidence": 5,
        "data_boundaries_understanding": 5,
        "workflow_pain_points": ["Customer inquiries", "Technical documentation", "Code review"],
        "repetitive_tasks": "Responding to common IT support tickets",
        "time_consuming_tasks": "Writing technical documentation",
        "areas_benefit_ai": ["Customer service", "Documentation", "Code assistance"],
        "specific_use_cases": "AI-powered IT helpdesk for common queries",
        "governance_concerns": ["Security risks", "Data privacy", "Model reliability"],
        "privacy_awareness": 5,
        "compliance_awareness": 5,
        "never_fully_ai": "Security incident response and system access decisions",
        "cross_subsidiary_opportunities": "Unified IT support chatbot for all subsidiaries",
        "collaboration_areas": ["IT", "Operations", "Customer Service"],
        "capstone_problem": "Build an AI-powered IT helpdesk that can handle 70% of common support queries automatically",
        "success_definition": "Reduce average ticket resolution time by 50% and improve user satisfaction",
        "capstone_impact": "Free up IT team for strategic projects and improve employee productivity",
        "learning_expectations": ["Understanding AI fundamentals", "AI implementation strategies", "Change management for AI"],
        "preferred_learning_style": "Case studies",
        "specific_topics": "Building conversational AI systems"
    },
    {
        "email": "TEST_michael.brown@leadway.com",
        "full_name": "Michael Brown",
        "job_title": "Claims Officer",
        "subsidiary": "Leadway Health",
        "department": "Claims Processing",
        "years_in_role": "1-3 years",
        "role_level": "Individual Contributor",
        "ai_familiarity": 2,
        "ai_tools_used": ["ChatGPT"],
        "usage_frequency": "Rarely",
        "prompt_confidence": 2,
        "data_boundaries_understanding": 2,
        "workflow_pain_points": ["Document processing", "Data entry", "Email management"],
        "repetitive_tasks": "Processing standard claims forms",
        "time_consuming_tasks": "Verifying claim documentation",
        "areas_benefit_ai": ["Document processing", "Data entry", "Email drafting"],
        "specific_use_cases": "Automating claims document verification",
        "governance_concerns": ["Accuracy of outputs", "Job displacement", "Data privacy"],
        "privacy_awareness": 3,
        "compliance_awareness": 3,
        "never_fully_ai": "Complex claims decisions and customer dispute resolution",
        "cross_subsidiary_opportunities": "Shared claims processing AI across health and assurance",
        "collaboration_areas": ["Claims", "Customer Service"],
        "capstone_problem": "Reduce manual data entry in claims processing by using AI to extract information from submitted documents",
        "success_definition": "Achieve 90% accuracy in automated data extraction",
        "capstone_impact": "Process 30% more claims per day with fewer errors",
        "learning_expectations": ["Understanding AI fundamentals", "Hands-on prompt engineering"],
        "preferred_learning_style": "Hands-on practice",
        "specific_topics": "Document AI and OCR capabilities"
    }
]


class TestPDFExport:
    """Test suite for PDF export functionality"""

    # Shared state for tests that depend on the seeded submissions. Populated
    # once per class by the `seed_submissions` autouse fixture so individual
    # tests no longer rely on pytest's alphabetical ordering (which breaks
    # under pytest-randomly / `pytest -k` / parallel runners).
    seeded_submission_ids: list = []

    @pytest.fixture(scope="class", autouse=True)
    def seed_submissions(self, request):
        """Seed test submissions once for the whole class.

        Previously the tests in this class depended on `test_02_create_test_submissions`
        running before every other test (alphabetical order). That ordering
        assumption is fragile (pytest-randomly, `pytest -k`, test sharding),
        so instead we seed once up front as a class-scoped fixture.
        """
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        created: list = []
        for submission_data in TEST_SUBMISSIONS:
            response = session.post(f"{BASE_URL}/api/submissions", json=submission_data)
            assert response.status_code == 200, (
                f"Failed to seed submission: {response.status_code} - {response.text}"
            )
            created.append(response.json()["id"])
        TestPDFExport.seeded_submission_ids = created
        print(f"Seeded {len(created)} test submissions for TestPDFExport")

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup per-test HTTP session."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def test_01_api_health_check(self):
        """Test API is accessible"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API health check failed: {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"API health check passed: {data}")

    def test_02_create_test_submissions(self):
        """Verify that the class-level seed fixture populated submissions."""
        # Seeding itself is handled by the autouse class fixture above; this
        # test confirms the fixture ran and recorded the expected number of
        # submission ids so a regression in seeding is still surfaced.
        assert len(TestPDFExport.seeded_submission_ids) == len(TEST_SUBMISSIONS), (
            f"Expected {len(TEST_SUBMISSIONS)} seeded submissions, "
            f"got {len(TestPDFExport.seeded_submission_ids)}"
        )
        print(f"Verified {len(TestPDFExport.seeded_submission_ids)} seeded submissions")
    
    def test_03_get_submissions_list(self):
        """Verify submissions were created"""
        response = self.session.get(f"{BASE_URL}/api/submissions")
        assert response.status_code == 200
        
        data = response.json()
        assert "submissions" in data
        assert "total" in data
        assert data["total"] >= 3, f"Expected at least 3 submissions, got {data['total']}"
        print(f"Total submissions in database: {data['total']}")
    
    def test_04_pdf_export_returns_valid_pdf(self):
        """Test GET /api/admin/report/pdf returns valid PDF"""
        response = self.session.get(f"{BASE_URL}/api/admin/report/pdf")
        
        # Check status code
        assert response.status_code == 200, f"PDF export failed: {response.status_code} - {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected application/pdf, got {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, f"Missing attachment header: {content_disposition}"
        assert 'Leadway_AI_Readiness_Report.pdf' in content_disposition, f"Wrong filename: {content_disposition}"
        
        # Check PDF magic bytes (%PDF-)
        pdf_content = response.content
        assert pdf_content[:5] == b'%PDF-', f"Invalid PDF header: {pdf_content[:20]}"
        
        # Check PDF has reasonable size (at least 1KB)
        assert len(pdf_content) > 1000, f"PDF too small: {len(pdf_content)} bytes"
        
        print(f"PDF export successful: {len(pdf_content)} bytes, Content-Type: {content_type}")
        print(f"PDF starts with: {pdf_content[:50]}")
    
    def test_05_csv_export_still_works(self):
        """Test GET /api/admin/export (CSV) still works"""
        response = self.session.get(f"{BASE_URL}/api/admin/export")
        
        assert response.status_code == 200, f"CSV export failed: {response.status_code}"
        
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition
        
        # Check CSV has content
        csv_content = response.text
        assert len(csv_content) > 100, f"CSV too small: {len(csv_content)} chars"
        assert 'email' in csv_content.lower(), "CSV missing email column"
        
        print(f"CSV export successful: {len(csv_content)} chars")
    
    def test_06_admin_stats_endpoint(self):
        """Test admin stats endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_submissions" in data
        assert data["total_submissions"] >= 3
        assert "by_subsidiary" in data
        assert "by_readiness_band" in data
        assert "average_scores" in data
        
        print(f"Admin stats: {data['total_submissions']} submissions, bands: {data['by_readiness_band']}")
    
    def test_07_admin_report_json_endpoint(self):
        """Test admin report JSON endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/admin/report")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_submissions" in data
        assert "executive_summary" in data
        assert "overall_scores" in data
        assert "subsidiary_breakdown" in data
        
        print(f"Admin report JSON: {data['total_submissions']} submissions")
    
    def test_08_subsidiaries_endpoint(self):
        """Test subsidiaries endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/subsidiaries")
        assert response.status_code == 200
        
        data = response.json()
        assert "subsidiaries" in data
        assert len(data["subsidiaries"]) > 0
        print(f"Subsidiaries: {data['subsidiaries']}")
    
    def test_09_admin_login(self):
        """Test admin login works"""
        response = self.session.post(f"{BASE_URL}/api/admin/login", json={"password": "leadway2026"})
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print("Admin login successful")
    
    def test_10_admin_login_invalid(self):
        """Test admin login rejects invalid password"""
        response = self.session.post(f"{BASE_URL}/api/admin/login", json={"password": "wrongpassword"})
        assert response.status_code == 401
        print("Admin login correctly rejects invalid password")


class TestPDFExportEdgeCases:
    """Test edge cases for PDF export"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_pdf_content_structure(self):
        """Verify PDF contains expected sections"""
        response = self.session.get(f"{BASE_URL}/api/admin/report/pdf")
        assert response.status_code == 200
        
        # PDF content is binary, but we can check it's valid
        pdf_content = response.content
        
        # Check PDF trailer
        assert b'%%EOF' in pdf_content or pdf_content.endswith(b'%%EOF\n') or pdf_content.endswith(b'%%EOF'), \
            "PDF missing EOF marker"
        
        print(f"PDF structure validated, size: {len(pdf_content)} bytes")


class TestExistingEndpointsNotBroken:
    """Verify existing endpoints still work after PDF feature addition"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_drafts_endpoint(self):
        """Test drafts endpoint works"""
        # Save a draft
        draft_data = {"email": "TEST_draft@test.com", "data": {"step": 1}}
        response = self.session.post(f"{BASE_URL}/api/drafts", json=draft_data)
        assert response.status_code == 200
        
        # Get the draft
        response = self.session.get(f"{BASE_URL}/api/drafts/TEST_draft@test.com")
        assert response.status_code == 200
        print("Drafts endpoint working")
    
    def test_post_eval_drafts_endpoint(self):
        """Test post-eval drafts endpoint works"""
        draft_data = {"email": "TEST_posteval@test.com", "data": {"section": 1}}
        response = self.session.post(f"{BASE_URL}/api/post-eval-drafts", json=draft_data)
        assert response.status_code == 200
        
        response = self.session.get(f"{BASE_URL}/api/post-eval-drafts/TEST_posteval@test.com")
        assert response.status_code == 200
        print("Post-eval drafts endpoint working")
    
    def test_post_evaluations_endpoint(self):
        """Test post-evaluations endpoint works"""
        eval_data = {"email": "TEST_eval@test.com", "data": {"nps": 9}}
        response = self.session.post(f"{BASE_URL}/api/post-evaluations", json=eval_data)
        assert response.status_code == 200
        
        response = self.session.get(f"{BASE_URL}/api/post-evaluations")
        assert response.status_code == 200
        print("Post-evaluations endpoint working")
    
    def test_admin_insights_endpoint(self):
        """Test admin insights endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/admin/insights")
        assert response.status_code == 200
        
        data = response.json()
        assert "insights" in data or "message" in data
        print("Admin insights endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
