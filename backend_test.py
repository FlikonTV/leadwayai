import requests
import sys
import json
from datetime import datetime

class LeadwayAPITester:
    def __init__(self, base_url="https://ai-readiness-scan.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_email = f"test_{datetime.now().strftime('%H%M%S')}@leadway.com"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_subsidiaries_endpoint(self):
        """Test subsidiaries endpoint"""
        return self.run_test("Get Subsidiaries", "GET", "subsidiaries", 200)

    def test_draft_save(self):
        """Test saving a draft"""
        draft_data = {
            "email": self.test_email,
            "data": {
                "full_name": "Test User",
                "job_title": "Test Manager",
                "subsidiary": "Leadway Assurance"
            }
        }
        return self.run_test("Save Draft", "POST", "drafts", 200, draft_data)

    def test_draft_retrieve(self):
        """Test retrieving a draft"""
        return self.run_test("Get Draft", "GET", f"drafts/{self.test_email}", 200)

    def test_submission_create(self):
        """Test creating a submission"""
        submission_data = {
            "email": self.test_email,
            "full_name": "Test User",
            "job_title": "Test Manager",
            "subsidiary": "Leadway Assurance",
            "department": "Testing",
            "years_in_role": "1-3 years",
            "role_level": "Manager",
            "ai_familiarity": 3,
            "ai_tools_used": ["ChatGPT", "Microsoft Copilot"],
            "usage_frequency": "Weekly",
            "prompt_confidence": 3,
            "data_boundaries_understanding": 4,
            "workflow_pain_points": ["Manual data entry", "Report generation"],
            "repetitive_tasks": "Daily report generation and data entry tasks",
            "time_consuming_tasks": "Manual analysis of customer data",
            "areas_benefit_ai": ["Customer service automation", "Document analysis and extraction"],
            "specific_use_cases": "Automating customer inquiry responses and document processing",
            "governance_concerns": ["Data privacy and security", "Regulatory compliance"],
            "privacy_awareness": 4,
            "compliance_awareness": 4,
            "never_fully_ai": "Final decision making on customer claims",
            "cross_subsidiary_opportunities": "Shared customer intelligence across subsidiaries",
            "collaboration_areas": ["Shared customer insights", "Unified reporting"],
            "capstone_problem": "Automating the customer onboarding process to reduce manual work",
            "success_definition": "Reduce onboarding time by 50% while maintaining accuracy",
            "capstone_impact": "Save 20 hours per week and improve customer satisfaction",
            "learning_expectations": ["Understanding AI fundamentals", "Hands-on prompt engineering"],
            "preferred_learning_style": "Hands-on practice",
            "specific_topics": "Practical AI implementation in insurance processes"
        }
        return self.run_test("Create Submission", "POST", "submissions", 200, submission_data)

    def test_submissions_list(self):
        """Test listing submissions"""
        return self.run_test("List Submissions", "GET", "submissions", 200)

    def test_admin_login_valid(self):
        """Test admin login with valid password"""
        login_data = {"password": "leadway2026"}
        return self.run_test("Admin Login (Valid)", "POST", "admin/login", 200, login_data)

    def test_admin_login_invalid(self):
        """Test admin login with invalid password"""
        login_data = {"password": "wrongpassword"}
        return self.run_test("Admin Login (Invalid)", "POST", "admin/login", 401, login_data)

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        return self.run_test("Admin Stats", "GET", "admin/stats", 200)

    def test_admin_export(self):
        """Test CSV export endpoint"""
        success, response = self.run_test("CSV Export", "GET", "admin/export", 200)
        if success:
            print("   CSV export successful")
        return success, response

    def test_submissions_with_filters(self):
        """Test submissions with filters"""
        return self.run_test("Submissions with Filter", "GET", "submissions?subsidiary=Leadway Assurance", 200)

def main():
    print("🚀 Starting Leadway AI Readiness API Tests")
    print("=" * 50)
    
    tester = LeadwayAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Subsidiaries", tester.test_subsidiaries_endpoint),
        ("Save Draft", tester.test_draft_save),
        ("Retrieve Draft", tester.test_draft_retrieve),
        ("Create Submission", tester.test_submission_create),
        ("List Submissions", tester.test_submissions_list),
        ("Admin Login (Valid)", tester.test_admin_login_valid),
        ("Admin Login (Invalid)", tester.test_admin_login_invalid),
        ("Admin Stats", tester.test_admin_stats),
        ("CSV Export", tester.test_admin_export),
        ("Filtered Submissions", tester.test_submissions_with_filters),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            success, _ = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())