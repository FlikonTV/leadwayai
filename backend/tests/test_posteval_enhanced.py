"""
Test suite for enhanced Post-Evaluation endpoints
Tests: GET /api/admin/post-eval-stats, GET /api/admin/post-eval-report/pdf, GET /api/admin/post-eval-export
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPostEvalStatsEnhanced:
    """Tests for enhanced /api/admin/post-eval-stats endpoint"""
    
    def test_post_eval_stats_returns_programme_effectiveness(self):
        """Test that post-eval-stats returns programme_effectiveness with grade and programme_score"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        assert response.status_code == 200
        data = response.json()
        
        # Check programme_effectiveness exists and has required fields
        assert "programme_effectiveness" in data, "Missing programme_effectiveness field"
        eff = data["programme_effectiveness"]
        assert "grade" in eff, "Missing grade in programme_effectiveness"
        assert "programme_score" in eff, "Missing programme_score in programme_effectiveness"
        assert "overall_session_avg" in eff, "Missing overall_session_avg"
        assert "avg_goal_achievement" in eff, "Missing avg_goal_achievement"
        assert "nps_classification" in eff, "Missing nps_classification"
        
        # Validate grade is valid
        assert eff["grade"] in ["A+", "A", "B+", "B", "C", "D"], f"Invalid grade: {eff['grade']}"
        # Validate programme_score is numeric
        assert isinstance(eff["programme_score"], (int, float)), "programme_score should be numeric"
        print(f"PASS: programme_effectiveness - Grade: {eff['grade']}, Score: {eff['programme_score']}")
    
    def test_post_eval_stats_returns_commitment_summary(self):
        """Test that post-eval-stats returns commitment_summary with commitment_rate"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "commitment_summary" in data, "Missing commitment_summary field"
        commit = data["commitment_summary"]
        assert "commitment_rate" in commit, "Missing commitment_rate"
        assert "participants_committed" in commit, "Missing participants_committed"
        assert "top_daily_tools" in commit, "Missing top_daily_tools"
        
        # Validate commitment_rate is percentage
        assert isinstance(commit["commitment_rate"], (int, float)), "commitment_rate should be numeric"
        assert 0 <= commit["commitment_rate"] <= 100, "commitment_rate should be 0-100"
        print(f"PASS: commitment_summary - Rate: {commit['commitment_rate']}%, Committed: {commit['participants_committed']}")
    
    def test_post_eval_stats_returns_feedback_highlights(self):
        """Test that post-eval-stats returns feedback_highlights with most_valuable array"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "feedback_highlights" in data, "Missing feedback_highlights field"
        feedback = data["feedback_highlights"]
        assert "most_valuable" in feedback, "Missing most_valuable array"
        assert "deeper_topics" in feedback, "Missing deeper_topics array"
        assert "team_messages" in feedback, "Missing team_messages array"
        assert "final_words" in feedback, "Missing final_words array"
        
        # Validate most_valuable is array with correct structure
        assert isinstance(feedback["most_valuable"], list), "most_valuable should be array"
        if len(feedback["most_valuable"]) > 0:
            item = feedback["most_valuable"][0]
            assert "name" in item, "most_valuable items should have name"
            assert "text" in item, "most_valuable items should have text"
        print(f"PASS: feedback_highlights - {len(feedback['most_valuable'])} most_valuable entries")
    
    def test_post_eval_stats_returns_agents_built_summary(self):
        """Test that post-eval-stats returns agents_built_summary"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "agents_built_summary" in data, "Missing agents_built_summary field"
        agents = data["agents_built_summary"]
        assert "agents_built" in agents, "Missing agents_built array"
        assert "prompt_status" in agents, "Missing prompt_status array"
        
        # Validate structure
        if len(agents["agents_built"]) > 0:
            item = agents["agents_built"][0]
            assert "name" in item, "agents_built items should have name"
            assert "count" in item, "agents_built items should have count"
            assert "percentage" in item, "agents_built items should have percentage"
        print(f"PASS: agents_built_summary - {len(agents['agents_built'])} agent types")
    
    def test_post_eval_stats_returns_capability_shift_summary(self):
        """Test that post-eval-stats returns capability_shift_summary"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "capability_shift_summary" in data, "Missing capability_shift_summary field"
        cap = data["capability_shift_summary"]
        assert "challenges_addressed" in cap, "Missing challenges_addressed array"
        assert "before_after_reflections" in cap, "Missing before_after_reflections array"
        
        # Validate structure
        if len(cap["challenges_addressed"]) > 0:
            item = cap["challenges_addressed"][0]
            assert "name" in item, "challenges_addressed items should have name"
            assert "count" in item, "challenges_addressed items should have count"
            assert "percentage" in item, "challenges_addressed items should have percentage"
        print(f"PASS: capability_shift_summary - {len(cap['challenges_addressed'])} challenges, {len(cap['before_after_reflections'])} reflections")


class TestPostEvalPDFExport:
    """Tests for /api/admin/post-eval-report/pdf endpoint"""
    
    def test_pdf_export_returns_valid_pdf(self):
        """Test that PDF export returns 200 with application/pdf content-type"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-report/pdf")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp, "Missing attachment in content-disposition"
        assert ".pdf" in content_disp, "Missing .pdf in filename"
        
        # Check PDF magic bytes
        assert response.content[:4] == b'%PDF', "Response does not start with PDF magic bytes"
        
        print(f"PASS: PDF export - {len(response.content)} bytes, valid PDF format")
    
    def test_pdf_export_has_reasonable_size(self):
        """Test that PDF has reasonable file size (not empty, not too large)"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-report/pdf")
        assert response.status_code == 200
        
        # PDF should be at least 1KB and less than 10MB
        size = len(response.content)
        assert size > 1024, f"PDF too small: {size} bytes"
        assert size < 10 * 1024 * 1024, f"PDF too large: {size} bytes"
        print(f"PASS: PDF size is reasonable: {size} bytes")


class TestPostEvalCSVExport:
    """Tests for /api/admin/post-eval-export endpoint"""
    
    def test_csv_export_returns_valid_csv(self):
        """Test that CSV export returns 200 with text/csv content-type"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-export")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp, "Missing attachment in content-disposition"
        assert ".csv" in content_disp, "Missing .csv in filename"
        
        print(f"PASS: CSV export - {len(response.content)} bytes")
    
    def test_csv_export_has_proper_headers(self):
        """Test that CSV has proper column headers"""
        import csv
        import io
        
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-export")
        assert response.status_code == 200
        
        content = response.content.decode('utf-8')
        reader = csv.reader(io.StringIO(content))
        headers = next(reader)
        
        # Check required headers exist
        required_headers = [
            "email", "full_name", "nps_score", "readiness_level",
            "goals_achieved", "submitted_at"
        ]
        for h in required_headers:
            assert h in headers, f"Missing required header: {h}"
        
        # Check tool rating columns exist
        tool_headers = [h for h in headers if h.startswith("tool_rating_")]
        assert len(tool_headers) > 0, "Missing tool_rating columns"
        
        # Check session rating columns exist
        session_headers = [h for h in headers if h.startswith("session_")]
        assert len(session_headers) > 0, "Missing session_ columns"
        
        # Check facilitator dimension columns exist
        dr_achi_headers = [h for h in headers if h.startswith("dr_achi_")]
        orimolade_headers = [h for h in headers if h.startswith("orimolade_")]
        assert len(dr_achi_headers) > 0, "Missing dr_achi_ columns"
        assert len(orimolade_headers) > 0, "Missing orimolade_ columns"
        
        print(f"PASS: CSV has {len(headers)} columns including tool ratings, session ratings, facilitator dimensions")
    
    def test_csv_export_has_data_rows(self):
        """Test that CSV has data rows (not just headers)"""
        import csv
        import io

        response = requests.get(f"{BASE_URL}/api/admin/post-eval-export")
        assert response.status_code == 200

        # Parse the CSV properly instead of splitting on '\n' — free-text fields
        # (e.g. most_valuable, final_words) may contain embedded newlines inside
        # quoted values, which would make a naive line count unreliable.
        content = response.content.decode('utf-8')
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)

        # Should have header + at least 1 data row
        assert len(rows) >= 2, f"CSV should have data rows, only has {len(rows)} rows"
        print(f"PASS: CSV has {len(rows) - 1} data rows")


class TestPostEval404Cases:
    """Tests for 404 cases when no evaluations exist"""
    
    @pytest.mark.skip(reason="Requires deleting all post_evaluations - run manually if needed")
    def test_pdf_export_returns_404_when_empty(self):
        """Test that PDF export returns 404 when no evaluations exist"""
        # This test requires deleting all post_evaluations first
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-report/pdf")
        assert response.status_code == 404
        print("PASS: PDF returns 404 when no evaluations")
    
    @pytest.mark.skip(reason="Requires deleting all post_evaluations - run manually if needed")
    def test_csv_export_returns_404_when_empty(self):
        """Test that CSV export returns 404 when no evaluations exist"""
        # This test requires deleting all post_evaluations first
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-export")
        assert response.status_code == 404
        print("PASS: CSV returns 404 when no evaluations")


class TestExistingEndpointsNotBroken:
    """Tests to ensure existing endpoints still work"""
    
    def test_admin_stats_still_works(self):
        """Test that pre-training admin stats endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_submissions" in data
        print(f"PASS: /api/admin/stats works - {data['total_submissions']} submissions")
    
    def test_admin_report_still_works(self):
        """Test that pre-training admin report endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/admin/report")
        assert response.status_code == 200
        print("PASS: /api/admin/report works")
    
    def test_admin_report_pdf_still_works(self):
        """Test that pre-training PDF report endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/admin/report/pdf")
        # May return 404 if no pre-training submissions, which is OK
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            assert "application/pdf" in response.headers.get("content-type", "")
        print(f"PASS: /api/admin/report/pdf returns {response.status_code}")
    
    def test_admin_export_still_works(self):
        """Test that pre-training CSV export endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/admin/export")
        # May return 404 if no pre-training submissions, which is OK
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            assert "text/csv" in response.headers.get("content-type", "")
        print(f"PASS: /api/admin/export returns {response.status_code}")
    
    def test_post_evaluations_list_still_works(self):
        """Test that post-evaluations list endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/post-evaluations")
        assert response.status_code == 200
        data = response.json()
        assert "evaluations" in data
        assert "total" in data
        print(f"PASS: /api/post-evaluations works - {data['total']} evaluations")
    
    def test_landing_page_api_works(self):
        """Test that root API endpoint works"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("PASS: /api/ root endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
