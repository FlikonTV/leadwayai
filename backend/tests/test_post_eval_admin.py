"""
Test suite for Post-Eval Admin Dashboard API
Tests the GET /api/admin/post-eval-stats endpoint and related functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPostEvalStatsEndpoint:
    """Tests for GET /api/admin/post-eval-stats endpoint"""
    
    def test_post_eval_stats_returns_200(self):
        """Test that post-eval-stats endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/admin/post-eval-stats returns 200")
    
    def test_post_eval_stats_has_total(self):
        """Test that response contains total count"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["total"], int), "Total should be an integer"
        print(f"PASS: Response has total={data['total']}")
    
    def test_post_eval_stats_has_nps_data(self):
        """Test that response contains NPS data when evaluations exist"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "nps" in data, "Response should contain 'nps' field"
            nps = data["nps"]
            assert "average" in nps, "NPS should have 'average'"
            assert "net_score" in nps, "NPS should have 'net_score'"
            assert "distribution" in nps, "NPS should have 'distribution'"
            
            dist = nps["distribution"]
            assert "promoters" in dist, "Distribution should have 'promoters'"
            assert "passives" in dist, "Distribution should have 'passives'"
            assert "detractors" in dist, "Distribution should have 'detractors'"
            print(f"PASS: NPS data present - avg={nps['average']}, net={nps['net_score']}")
        else:
            print("SKIP: No evaluations to test NPS data")
    
    def test_post_eval_stats_has_readiness_distribution(self):
        """Test that response contains readiness level distribution"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "readiness_distribution" in data, "Response should contain 'readiness_distribution'"
            assert isinstance(data["readiness_distribution"], dict), "readiness_distribution should be a dict"
            print(f"PASS: Readiness distribution present: {data['readiness_distribution']}")
        else:
            print("SKIP: No evaluations to test readiness distribution")
    
    def test_post_eval_stats_has_session_ratings(self):
        """Test that response contains session ratings averages"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "session_ratings" in data, "Response should contain 'session_ratings'"
            session_ratings = data["session_ratings"]
            assert isinstance(session_ratings, dict), "session_ratings should be a dict"
            
            # Check for expected session keys
            expected_sessions = [
                "Day 1 Strategy Session",
                "Day 1 Claude + TABS-D Framework",
                "Day 2 GPTBots Agent Building",
                "Overall Programme Quality"
            ]
            for session in expected_sessions:
                if session in session_ratings:
                    assert isinstance(session_ratings[session], (int, float)), f"{session} rating should be numeric"
            print(f"PASS: Session ratings present with {len(session_ratings)} sessions")
        else:
            print("SKIP: No evaluations to test session ratings")
    
    def test_post_eval_stats_has_facilitator_ratings(self):
        """Test that response contains facilitator ratings"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "facilitator1_ratings" in data, "Response should contain 'facilitator1_ratings'"
            assert "facilitator2_ratings" in data, "Response should contain 'facilitator2_ratings'"
            
            fac1 = data["facilitator1_ratings"]
            fac2 = data["facilitator2_ratings"]
            
            expected_dims = ["expertise", "delivery", "facilitation", "immersive", "support"]
            for dim in expected_dims:
                if dim in fac1:
                    assert isinstance(fac1[dim], (int, float)), f"Facilitator1 {dim} should be numeric"
                if dim in fac2:
                    assert isinstance(fac2[dim], (int, float)), f"Facilitator2 {dim} should be numeric"
            
            print(f"PASS: Facilitator ratings present - Fac1: {fac1}, Fac2: {fac2}")
        else:
            print("SKIP: No evaluations to test facilitator ratings")
    
    def test_post_eval_stats_has_tool_averages(self):
        """Test that response contains tool comfort averages"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "tool_averages" in data, "Response should contain 'tool_averages'"
            tool_avgs = data["tool_averages"]
            assert isinstance(tool_avgs, dict), "tool_averages should be a dict"
            
            for tool, avg in tool_avgs.items():
                assert isinstance(avg, (int, float)), f"Tool {tool} average should be numeric"
            
            print(f"PASS: Tool averages present: {tool_avgs}")
        else:
            print("SKIP: No evaluations to test tool averages")
    
    def test_post_eval_stats_has_goals_achieved(self):
        """Test that response contains goals achieved data"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "goals_achieved" in data, "Response should contain 'goals_achieved'"
            goals = data["goals_achieved"]
            assert isinstance(goals, list), "goals_achieved should be a list"
            
            if len(goals) > 0:
                goal = goals[0]
                assert "name" in goal, "Goal should have 'name'"
                assert "count" in goal, "Goal should have 'count'"
                assert "percentage" in goal, "Goal should have 'percentage'"
            
            print(f"PASS: Goals achieved present with {len(goals)} goals")
        else:
            print("SKIP: No evaluations to test goals achieved")
    
    def test_post_eval_stats_has_one_thing_status(self):
        """Test that response contains one thing status distribution"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "one_thing_status" in data, "Response should contain 'one_thing_status'"
            assert isinstance(data["one_thing_status"], dict), "one_thing_status should be a dict"
            print(f"PASS: One thing status present: {data['one_thing_status']}")
        else:
            print("SKIP: No evaluations to test one thing status")
    
    def test_post_eval_stats_has_submissions_list(self):
        """Test that response contains submissions list with required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/post-eval-stats")
        data = response.json()
        
        if data["total"] > 0:
            assert "submissions" in data, "Response should contain 'submissions'"
            submissions = data["submissions"]
            assert isinstance(submissions, list), "submissions should be a list"
            assert len(submissions) == data["total"], "submissions count should match total"
            
            if len(submissions) > 0:
                sub = submissions[0]
                required_fields = ["id", "email", "full_name", "subsidiary_department", 
                                   "readiness_level", "nps_score", "submitted_at"]
                for field in required_fields:
                    assert field in sub, f"Submission should have '{field}'"
            
            print(f"PASS: Submissions list present with {len(submissions)} entries")
        else:
            print("SKIP: No evaluations to test submissions list")


class TestPostEvaluationsEndpoint:
    """Tests for GET /api/post-evaluations endpoint (used for detail view)"""
    
    def test_get_post_evaluations_returns_200(self):
        """Test that post-evaluations endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/post-evaluations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/post-evaluations returns 200")
    
    def test_get_post_evaluations_has_structure(self):
        """Test that response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/post-evaluations")
        data = response.json()
        
        assert "evaluations" in data, "Response should contain 'evaluations'"
        assert "total" in data, "Response should contain 'total'"
        assert isinstance(data["evaluations"], list), "evaluations should be a list"
        print(f"PASS: Response structure correct with {data['total']} evaluations")
    
    def test_get_post_evaluations_full_data(self):
        """Test that full evaluation data is returned for detail view"""
        response = requests.get(f"{BASE_URL}/api/post-evaluations")
        data = response.json()
        
        if data["total"] > 0:
            eval_item = data["evaluations"][0]
            assert "id" in eval_item, "Evaluation should have 'id'"
            assert "email" in eval_item, "Evaluation should have 'email'"
            assert "data" in eval_item, "Evaluation should have 'data'"
            assert "submitted_at" in eval_item, "Evaluation should have 'submitted_at'"
            
            # Check data contains expected fields for detail view
            eval_data = eval_item["data"]
            expected_data_fields = ["full_name", "job_title", "readiness_level", 
                                    "tool_ratings", "session_ratings", "nps_score"]
            for field in expected_data_fields:
                if field in eval_data:
                    print(f"  - {field}: present")
            
            print(f"PASS: Full evaluation data present for detail view")
        else:
            print("SKIP: No evaluations to test full data")


class TestExistingEndpointsNotBroken:
    """Verify existing endpoints still work after Post-Eval tab addition"""
    
    def test_admin_stats_still_works(self):
        """Test that /api/admin/stats still works"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "total_submissions" in data, "Should have total_submissions"
        print(f"PASS: /api/admin/stats works - {data['total_submissions']} submissions")
    
    def test_admin_report_still_works(self):
        """Test that /api/admin/report still works"""
        response = requests.get(f"{BASE_URL}/api/admin/report")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/admin/report works")
    
    def test_admin_login_still_works(self):
        """Test that /api/admin/login still works"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "leadway2026"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True, "Login should succeed"
        print("PASS: /api/admin/login works")
    
    def test_submissions_endpoint_still_works(self):
        """Test that /api/submissions still works"""
        response = requests.get(f"{BASE_URL}/api/submissions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "submissions" in data, "Should have submissions"
        assert "total" in data, "Should have total"
        print(f"PASS: /api/submissions works - {data['total']} submissions")
    
    def test_subsidiaries_endpoint_still_works(self):
        """Test that /api/subsidiaries still works"""
        response = requests.get(f"{BASE_URL}/api/subsidiaries")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "subsidiaries" in data, "Should have subsidiaries"
        print(f"PASS: /api/subsidiaries works - {len(data['subsidiaries'])} subsidiaries")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
