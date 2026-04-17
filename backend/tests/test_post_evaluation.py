"""
Post-Evaluation API Tests
Tests for the new post-training evaluation endpoints:
- POST /api/post-eval-drafts - Save draft
- GET /api/post-eval-drafts/:email - Get draft
- POST /api/post-evaluations - Submit final evaluation
- GET /api/post-evaluations - List all evaluations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_email():
    """Generate unique test email"""
    return f"TEST_posteval_{uuid.uuid4().hex[:8]}@leadway.com"


class TestPostEvalDrafts:
    """Tests for post-evaluation draft endpoints"""
    
    def test_save_draft_new(self, api_client, test_email):
        """Test saving a new draft"""
        payload = {
            "email": test_email,
            "data": {
                "full_name": "Test User",
                "job_title": "Test Manager",
                "section": 1
            }
        }
        response = api_client.post(f"{BASE_URL}/api/post-eval-drafts", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Draft saved"
        assert data["email"] == test_email
        assert "id" in data
        print(f"✓ Draft saved with id: {data['id']}")
    
    def test_get_draft(self, api_client, test_email):
        """Test retrieving a saved draft"""
        # First save a draft
        save_payload = {
            "email": test_email,
            "data": {"full_name": "Test User", "readiness_level": "Practitioner"}
        }
        api_client.post(f"{BASE_URL}/api/post-eval-drafts", json=save_payload)
        
        # Then retrieve it
        response = api_client.get(f"{BASE_URL}/api/post-eval-drafts/{test_email}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert data["data"]["full_name"] == "Test User"
        assert data["data"]["readiness_level"] == "Practitioner"
        print(f"✓ Draft retrieved successfully")
    
    def test_update_draft(self, api_client, test_email):
        """Test updating an existing draft"""
        # Save initial draft
        initial_payload = {
            "email": test_email,
            "data": {"full_name": "Initial Name", "section": 1}
        }
        api_client.post(f"{BASE_URL}/api/post-eval-drafts", json=initial_payload)
        
        # Update draft
        update_payload = {
            "email": test_email,
            "data": {"full_name": "Updated Name", "section": 3, "nps_score": 8}
        }
        response = api_client.post(f"{BASE_URL}/api/post-eval-drafts", json=update_payload)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Draft updated"
        
        # Verify update
        get_response = api_client.get(f"{BASE_URL}/api/post-eval-drafts/{test_email}")
        data = get_response.json()
        assert data["data"]["full_name"] == "Updated Name"
        assert data["data"]["section"] == 3
        assert data["data"]["nps_score"] == 8
        print(f"✓ Draft updated and verified")
    
    def test_get_nonexistent_draft(self, api_client):
        """Test getting a draft that doesn't exist"""
        response = api_client.get(f"{BASE_URL}/api/post-eval-drafts/nonexistent@test.com")
        
        assert response.status_code == 404
        assert "No draft found" in response.json()["detail"]
        print(f"✓ 404 returned for nonexistent draft")


class TestPostEvaluations:
    """Tests for post-evaluation submission endpoints"""
    
    def test_submit_evaluation(self, api_client, test_email):
        """Test submitting a final evaluation"""
        payload = {
            "email": test_email,
            "data": {
                "full_name": "Test Participant",
                "job_title": "Senior Manager",
                "subsidiary_department": "Leadway Assurance / Claims",
                "readiness_level": "Integrator",
                "nps_score": 9,
                "tool_ratings": {"Claude (Anthropic) + TABS-D™": 5, "ChatGPT": 4},
                "goals_achieved": ["Understanding AI fundamentals", "Hands-on prompt engineering"]
            }
        }
        response = api_client.post(f"{BASE_URL}/api/post-evaluations", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert "id" in data
        assert "submitted_at" in data
        assert data["data"]["full_name"] == "Test Participant"
        assert data["data"]["nps_score"] == 9
        print(f"✓ Evaluation submitted with id: {data['id']}")
    
    def test_list_evaluations(self, api_client):
        """Test listing all evaluations"""
        response = api_client.get(f"{BASE_URL}/api/post-evaluations")
        
        assert response.status_code == 200
        data = response.json()
        assert "evaluations" in data
        assert "total" in data
        assert isinstance(data["evaluations"], list)
        assert data["total"] >= 0
        print(f"✓ Listed {data['total']} evaluations")
    
    def test_submit_and_verify_draft_deleted(self, api_client, test_email):
        """Test that draft is deleted after submission"""
        # Save a draft first
        draft_payload = {"email": test_email, "data": {"full_name": "Draft User"}}
        api_client.post(f"{BASE_URL}/api/post-eval-drafts", json=draft_payload)
        
        # Verify draft exists
        draft_response = api_client.get(f"{BASE_URL}/api/post-eval-drafts/{test_email}")
        assert draft_response.status_code == 200
        
        # Submit evaluation
        submit_payload = {"email": test_email, "data": {"full_name": "Final User", "nps_score": 10}}
        api_client.post(f"{BASE_URL}/api/post-evaluations", json=submit_payload)
        
        # Verify draft is deleted
        draft_check = api_client.get(f"{BASE_URL}/api/post-eval-drafts/{test_email}")
        assert draft_check.status_code == 404
        print(f"✓ Draft deleted after submission")


class TestExistingEndpoints:
    """Verify existing pre-training endpoints still work"""
    
    def test_root_endpoint(self, api_client):
        """Test API root"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert "Leadway AI Readiness API" in response.json()["message"]
        print(f"✓ Root endpoint working")
    
    def test_subsidiaries_endpoint(self, api_client):
        """Test subsidiaries list"""
        response = api_client.get(f"{BASE_URL}/api/subsidiaries")
        assert response.status_code == 200
        data = response.json()
        assert "subsidiaries" in data
        assert "Leadway Assurance" in data["subsidiaries"]
        print(f"✓ Subsidiaries endpoint working")
    
    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": "leadway2026"})
        assert response.status_code == 200
        assert response.json()["success"] == True
        print(f"✓ Admin login working")
    
    def test_admin_login_invalid(self, api_client):
        """Test admin login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": "wrongpassword"})
        assert response.status_code == 401
        print(f"✓ Admin login rejects invalid password")
    
    def test_submissions_list(self, api_client):
        """Test pre-training submissions list"""
        response = api_client.get(f"{BASE_URL}/api/submissions")
        assert response.status_code == 200
        data = response.json()
        assert "submissions" in data
        assert "total" in data
        print(f"✓ Pre-training submissions endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
